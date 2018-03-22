import * as YAML from 'js-yaml';
import * as utils from 'loader-utils';
import { extname, join } from 'path';

import { Context } from './context';
import { getOptions, Options } from './options';
import { readFile, request, resolveNestedPromises } from './utils';

export { Context } from './context';
export { Options, ParserOptions } from './options';

/**
 * Retrieves the file content and the location of the specified file.
 * @param dir The working directory
 * @param file The file path
 * @param checkExt Whether to try different extensions
 */
const importFile = async (
    dir: string,
    file: string,
    checkExt = true
): Promise<{ file: string; data: string }> => {
    // Resolve remote imports
    if (file.startsWith('http://') || file.startsWith('https://')) {
        const data = await request(file);
        return { file, data };
    }

    // Try importing the file with different extensions if none is provided
    if (checkExt && !extname(file)) {
        let error: any;
        return importFile(dir, file, false)
            .catch(err => (error = err))
            .then(() => importFile(dir, file + '.yml'))
            .catch(() => importFile(dir, file + '.yaml'))
            .catch(() => importFile(dir, file + '.json'))
            .catch(() => Promise.reject(error));
    }

    // If the file name starts with a '.' it will be a local import. Otherwise
    // it is a module import which must be resolved using require.
    let location = file.startsWith('.')
        ? join(dir, file)
        : require.resolve(file);

    let data = await readFile(location);
    return { file: location, data };
};

const parseRootImports = async (context: Context): Promise<Context> => {
    let oldLines = context.input.split('\n');
    let newLines: string[] = [];

    const { importKeyword: k, importRawKeyword: rk } = context.options;
    const regexStr = `^!(${k}|${rk})\\s+(.*)(\\.ya?ml|\\.json)?['"]?\\s*$`;
    const regex = new RegExp(regexStr);

    for (let line of oldLines) {
        const match = line.match(regex);
        if (!match) {
            newLines.push(line);
            continue;
        }

        let name = match[2];
        if (
            (name.startsWith("'") && name.endsWith("'")) ||
            (name.startsWith('"') && name.endsWith('"'))
        )
            name = name.slice(1, -1);

        const { file, data } = await importFile(context.directory, name);
        context.dependencies.add(file);

        let obj: any;
        if (!file.endsWith('.json')) {
            const { output, dependencies } = await parseImports(
                new Context(data, file, context.options)
            );
            dependencies.forEach(dep => context.dependencies.add(dep));
            obj = output;
        } else obj = JSON.parse(data);

        newLines.push(...YAML.safeDump(obj).split('\n'));
    }

    context.input = newLines.join('\n');
    return context;
};

const parseImports = async (context: Context): Promise<Context> => {
    if (context.options.importRoot) context = await parseRootImports(context);

    const options = context.options;
    let types: YAML.Type[] = [];

    // !import <file>.
    if (options.importNested && options.importKeyword) {
        types.push(
            new YAML.Type('!' + options.importKeyword, {
                kind: 'scalar',
                construct: async (uri: string) => {
                    context.resolveAsync = true;

                    const { file, data } = await importFile(
                        context.directory,
                        uri
                    );
                    context.dependencies.add(file);

                    const { output, dependencies } = await parseImports(
                        new Context(data, file, context.options)
                    );
                    dependencies.forEach(dep => context.dependencies.add(dep));
                    return output;
                }
            })
        );
    }

    // !import-raw <file>.
    if (options.importNested && options.importRawKeyword) {
        types.push(
            new YAML.Type('!' + options.importRawKeyword, {
                kind: 'scalar',
                construct: async (uri: string) => {
                    context.resolveAsync = true;

                    const { file, data } = await importFile(
                        context.directory,
                        uri
                    );
                    context.dependencies.add(file);
                    return data;
                }
            })
        );
    }

    // Include custom types.
    if (options.parser.types) {
        for (let type of options.parser.types) {
            if (typeof type === 'function') types.push(type(context));
            else types.push(type);
        }
    }

    // Allow custom base schema.
    let include = !Array.isArray(options.parser.schema)
        ? options.parser.schema instanceof YAML.Schema
            ? [options.parser.schema]
            : []
        : (options.parser.schema as YAML.Schema[]).filter(
              entry => entry instanceof YAML.Schema
          );

    // Parse documents.
    const docs: any[] = [];
    YAML.safeLoadAll(context.input, doc => docs.push(doc), {
        filename: context.filename,
        schema: new YAML.Schema({ include, explicit: types }),
        json: options.parser.allowDuplicate,
        onWarning: options.parser.onWarning
    } as any);

    // Do not wrap in an array if only a single document was included.
    const parsed = docs.length > 1 ? docs : docs[0];

    // Since the construct function in our import type is async we
    // could have nested promises, these have to be resolved.
    context.output = context.resolveAsync
        ? await resolveNestedPromises(parsed)
        : parsed;

    return context;
};

export type parse = {
    (source: string, path: string, options: Options): Promise<Context>;
    (path: string, options?: Options): Promise<any>;
};

export const parse: parse = async (
    param1: string,
    param2?: string | Options,
    param3?: Options
) => {
    // Retrieve parameters
    const hasSource = typeof param2 === 'string';
    const source = hasSource ? param1 : await readFile(param1);
    const path = hasSource ? (param2 as string) : param1;
    const opts = (hasSource ? param3 : (param2 as Options)) || { parser: {} };

    // Merge default options with user specified options & create context
    const context = new Context(
        source,
        path,
        getOptions(opts, !hasSource ? 'raw' : undefined)
    );

    const result = parseImports(context);
    return hasSource ? result : result.then(ctx => ctx.output);
};

async function load(this: any, source: string) {
    if (this.cacheable) this.cacheable();

    const callback = this.async();
    const userOptions = utils.getOptions(this);

    try {
        const context = await parse(source, this.resourcePath, userOptions);

        context.dependencies.forEach(dep => {
            if (!dep.startsWith('http://') && !dep.startsWith('https://'))
                this.addDependency(dep);
        });

        switch (context.options.output) {
            case 'json':
                callback(undefined, JSON.stringify(context.output));
                break;
            case 'yaml':
            case 'yml':
                callback(undefined, YAML.safeDump(context.output));
                break;
            case 'raw':
                callback(undefined, context.output);
                break;
            default:
                const json = JSON.stringify(context.output);
                callback(undefined, `module.exports = ${json};`);
                break;
        }
    } catch (err) {
        this.emitError(err);
        callback(err, undefined);
    }
}

export interface YamlImportLoader {
    (source: string): void;
    parse: parse;
}

const loader: any = load;
loader.parse = parse;
loader.default = loader;

export default loader as YamlImportLoader;
module.exports = loader as YamlImportLoader;
