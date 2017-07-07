const { join, dirname, extname } = require('path');
const { readFile } = require('fs');
const YAML  = require('js-yaml');
const utils = require('loader-utils');

const defaultOptions = {
    importRoot: false,
    importNested: true,
    importKeyword: 'import',
    importRawKeyword: 'import-raw',
    output: 'object'
};

const read = (file, ext = true) => {
    if (ext && !extname(file)) {
        let error;
        return read(file, false).catch(err => error = err)
            .then(_ => read(file + '.yml'))
            .catch(_ => read(file + '.yaml'))
            .catch(_ => read(file + '.json'))
            .catch(_ => Promise.reject(error));
    }

    return new Promise((resolve, reject) => {
        readFile(file, (err, data) => {
            if (err)
                reject(err);
            else
                resolve({ file, data: data.toString() });
        });
    });
};

const parseRootImports = (source, path, options) => {
    let oldLines = source.split('\n');
    let newLines = [];
    let deps = {};
    let promises = [];

    const { importKeyword, importRawKeyword } = options;
    const regex = new RegExp(`^!(${importKeyword}|${importRawKeyword})\\s+['"]?(.*)(\\.ya?ml|\\.json)?['"]?\\s*$`);
    for (let i = 0; i < oldLines.length; i++) {
        const line  = oldLines[i];
        const match = line.match(regex);
        
        if (match) {
            let promise = read(join(path, match[2]))
                .then(({ file, data }) => {
                    deps[file] = true;

                    return file.endsWith('.json')
                        ? { obj: JSON.parse(data), deps: {} }
                        : parseImports(data, dirname(file), options);
                })
                .then(result => {
                    Object.assign(deps, result.deps);
                    newLines.push(...YAML.safeDump(result.obj).split('\n'));
                });

            promises.push(promise);
            continue;
        }
        
        newLines.push(line);
    }

    return Promise.all(promises).then(_ => ({ lines: newLines, deps }));
};

const resolvePromises = (value) => {
    if (value instanceof Promise)
        return value;

    if (value instanceof Array)
        return Promise.all(value.map(entry => resolvePromises(entry)));
    
    if (typeof value === 'object') {
        const keys = Object.keys(value);

        return Promise.all(keys.map(key => resolvePromises(value[key])))
            .then(properties => {
                let obj = {};
                keys.forEach((key, i) => {
                    obj[key] = properties[i];
                });
                return obj;
            });

    }

    return Promise.resolve(value);
};

const parseImports = (source, path, options) => {
    let root = options.importRoot
        ? parseRootImports(source, path, options).then(({ lines, deps }) => ({ source: lines.join('\n'), deps }))
        : Promise.resolve({ source, deps: {} });

    return root.then(({ source, deps }) => {
        let types = [];
        let containsPromises = false

        if (options.importNested) {
            types.push(new YAML.Type('!' + options.importKeyword, {
                kind: 'scalar',
                construct: uri => {
                    containsPromises = true;

                    return read(join(path, uri))
                        .then(({ file, data }) => {
                            deps[file] = true;
                            return parseImports(data, dirname(file), options);
                        })
                        .then(result => {
                            Object.assign(deps, result.deps);
                            return result.obj;
                        });
                }
            }));

            types.push(new YAML.Type('!' + options.importRawKeyword, {
                kind: 'scalar',
                construct: uri => {
                    containsPromises = true;

                    return read(join(path, uri))
                        .then(({ file, data }) => {
                            deps[file] = true;
                            return data;
                        });
                }
            }));
        }

        const schema = YAML.Schema.create(types);
        const parsed = YAML.safeLoad(source, { schema });

        // Since the construct function in our import type is async we
        // could have nested promises, these have to be resolved.
        return containsPromises
            ? resolvePromises(parsed).then(obj => ({ obj, deps }))
            : Promise.resolve({ obj: parsed, deps })
    });
};

function load(source) {
    this.cacheable && this.cacheable();
    const callback = this.async();

    let options = Object.assign({}, defaultOptions, utils.getOptions(this));
    parseImports(source, dirname(this.resourcePath), options)
        .then(({ obj, deps }) => {
            for (let dep of Object.keys(deps))
                this.addDependency(dep);

            if (options.output === 'json')
                callback(null, JSON.stringify(obj));
            else if (options.output === 'yaml')
                callback(null, YAML.safeDump(obj));
            else if (options.output === 'raw')
                callback(null, obj)
            else
                callback(null, `module.exports = ${JSON.stringify(obj)};`);
        })
        .catch(err => {
            this.emitError(err);
            callback(err, null);
        });
};

module.exports = load;
