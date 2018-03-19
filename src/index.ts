import * as YAML from 'js-yaml';
import * as utils from 'loader-utils';
import { basename, dirname, extname, join } from 'path';

export class Context {
    public dependencies = new Set<string>();
    public resolveAsync = false;
    public output: any;
    public directory: string;
    public filename: string;

    constructor(
        public input: string,
        public path: string,
        public options: Options
    ) {
        this.directory = dirname(path);
        this.filename = basename(path);
    }
}

export interface Options {
    importRoot?: boolean;
    importNested?: boolean;
    importKeyword?: string;
    importRawKeyword?: string;
    output?: 'object' | 'json' | 'yaml' | 'yml' | 'raw';
    parser?: ParserOptions;
}

export interface ParserOptions {
    types?: (((context: Context) => YAML.Type) | YAML.Type)[];
    schema?: YAML.Schema | YAML.Schema[] | undefined;
    allowDuplicate?: boolean;
    onWarning?: ((error: YAML.YAMLException) => void);
}

const defaultOptions: Options = {
    importRoot: false,
    importNested: true,
    importKeyword: 'import',
    importRawKeyword: 'import-raw',
    output: 'object',
    parser: {
        types: [],
        schema: YAML.SAFE_SCHEMA,
        allowDuplicate: true,
        onWarning: undefined
    }
};

const request = async (uri: string, isHttps = true): Promise<string> => {
    const http = await import('http');
    const https = await import('https');

    return new Promise<string>((resolve, reject) => {
        let result = '';

        if (isHttps) {
            https.get(uri, res => {
                res.on('data', data => (result += data));
                res.on('end', () => resolve(result));
                res.on('error', err => reject(err));
            });
        } else {
            http.get(uri, res => {
                res.on('data', data => (result += data));
                res.on('end', () => resolve(result));
                res.on('error', err => reject(err));
            });
        }
    });
};

const readFile = async (path: string) => {
    const fs = await import('fs');
    return new Promise<string>((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) reject(err);
            else resolve(data.toString());
        });
    });
};

type ImportResult = { file: string; data: string };

const read = async (
    dir: string,
    file: string,
    checkExt = true
): Promise<ImportResult> => {
    if (checkExt && !extname(file)) {
        let error: any;
        return read(dir, file, false)
            .catch(err => (error = err))
            .then(_ => read(dir, file + '.yml'))
            .catch(_ => read(dir, file + '.yaml'))
            .catch(_ => read(dir, file + '.json'))
            .catch(_ => Promise.reject(error));
    }

    let location = file.startsWith('.')
        ? join(dir, file)
        : require.resolve(file);

    let data = await readFile(location);
    return { file: location, data };
};

const performImport = (
    dir: string,
    file: string,
    checkExt = true
): Promise<ImportResult> => {
    if (file.startsWith('https://'))
        return request(file, true).then(data => ({ file, data }));
    else if (file.startsWith('http://'))
        return request(file, false).then(data => ({ file, data }));
    else return read(dir, file, checkExt);
};

const resolvePromises = (value: any): Promise<any> => {
    if (value instanceof Promise) return value;

    if (value instanceof Array)
        return Promise.all(value.map(entry => resolvePromises(entry)));

    // tslint:disable-next-line no-null-keyword
    if (typeof value === 'object' && value !== null) {
        const keys = Object.keys(value);

        return Promise.all(keys.map(key => resolvePromises(value[key]))).then(
            properties => {
                let obj: any = {};
                keys.forEach((key, i) => (obj[key] = properties[i]));
                return obj;
            }
        );
    }

    return Promise.resolve(value);
};

const parseRootImports = async (context: Context): Promise<Context> => {
    let oldLines = context.input.split('\n');
    let newLines: string[] = [];

    const { importKeyword, importRawKeyword } = context.options;
    const regex = new RegExp(
        `^!(${importKeyword}|${importRawKeyword})\\s+(.*)(\\.ya?ml|\\.json)?['"]?\\s*$`
    );

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

        const { file, data } = await performImport(context.directory, name);
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

                    const { file, data } = await performImport(
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

                    const { file, data } = await performImport(
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
    if (options.parser!.types) {
        for (let type of options.parser!.types!) {
            if (typeof type === 'function') types.push(type(context));
            else types.push(type);
        }
    }

    // Allow custom base schema.
    let include = !Array.isArray(options.parser!.schema!)
        ? options.parser!.schema! instanceof YAML.Schema
            ? [options.parser!.schema!]
            : []
        : (options.parser!.schema as YAML.Schema[]).filter(
              entry => entry instanceof YAML.Schema
          );

    // Parse documents.
    const docs: any[] = [];
    YAML.safeLoadAll(context.input, doc => docs.push(doc), {
        filename: context.filename,
        schema: new YAML.Schema({ include, explicit: types }),
        json: options.parser!.allowDuplicate,
        onWarning: options.parser!.onWarning
    } as any);

    // Do not wrap in an array if only a single document was included.
    const parsed = docs.length > 1 ? docs : docs[0];

    // Since the construct function in our import type is async we
    // could have nested promises, these have to be resolved.
    context.output = context.resolveAsync
        ? await resolvePromises(parsed)
        : parsed;

    return context;
};

export type parse = {
    (source: string, path: string, options: Options): Promise<Context>;
    (path: string, options?: Options): Promise<any>;
};

export const parse: parse = async (
    sourceOrPath: string,
    pathOrOptions?: string | Options,
    options?: Options
) => {
    const isFromLoader = typeof pathOrOptions === 'string';

    const source = isFromLoader ? sourceOrPath : await readFile(sourceOrPath);
    const path = isFromLoader ? (pathOrOptions as string) : sourceOrPath;
    const opts = (isFromLoader ? options : (pathOrOptions as Options)) || {};

    const result = parseImports(
        new Context(source, path, {
            ...defaultOptions,
            output: isFromLoader ? defaultOptions.output : 'raw',
            ...opts,
            parser: {
                ...defaultOptions.parser,
                ...opts.parser
            }
        })
    );

    return isFromLoader ? result : result.then(ctx => ctx.output);
};

function load(this: any, source: string) {
    if (this.cacheable) this.cacheable();

    const callback = this.async();
    const userOptions = utils.getOptions(this);

    parse(source, this.resourcePath, userOptions)
        .then(context => {
            context.dependencies.forEach(dep => {
                if (!dep.startsWith('http://') && !dep.startsWith('https://'))
                    this.addDependency(dep);
            });

            if (context.options.output === 'json')
                callback(undefined, JSON.stringify(context.output));
            else if (
                context.options.output === 'yaml' ||
                context.options.output === 'yml'
            )
                callback(undefined, YAML.safeDump(context.output));
            else if (context.options.output === 'raw')
                callback(undefined, context.output);
            else
                callback(
                    undefined,
                    `module.exports = ${JSON.stringify(context.output)};`
                );
        })
        .catch(err => {
            this.emitError(err);
            callback(err, undefined);
        });
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
