const { join, dirname, extname } = require('path');
const { readFile } = require('fs');
const YAML  = require('js-yaml');
const utils = require('loader-utils');

const defaultOptions = {
    importRoot: false,
    importNested: true,
    importKeyword: 'import',
    output: 'object'
};

const read = (file) => {
    if (!extname(file)) {
        return read(file + '.yml')
            .catch(_ => read(file + '.yaml'));
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

    for (let i = 0; i < oldLines.length; i++) {
        const line  = oldLines[i];
        const regex = new RegExp(`^!${options.importKeyword}\\s+['"]?(.*)(\\.ya?ml|\\.json)?['"]?\\s*$`);
        const match = line.match(regex);
        
        if (match) {
            promises.push(
                read(join(path, match[1]))
                    .then(({ file, data }) => {
                        deps[file] = true;
                        if (file.endsWith('.json')) {
                            return {
                                lines: YAML.safeDump(JSON.parse(data)).split('\n'),
                                deps: {}
                            };
                        }
                        return parseRootImports(data, dirname(file), options);
                    })
                    .then(result => {
                        Object.assign(deps, result.deps);
                        newLines.push(...result.lines);
                    })
            );
        }
        else
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

        if (options.importNested) {
            types.push(new YAML.Type('!' + options.importKeyword, {
                kind: 'scalar',
                construct: uri => {
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
        }

        const schema = YAML.Schema.create(types);

        // Since the construct function in our import type is async we
        // are left with nested promises, these have to be resolved.
        return resolvePromises(YAML.safeLoad(source, { schema })).then(obj => ({ obj, deps }));
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
