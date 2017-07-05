const { join, dirname } = require('path');
const { readFile } = require('fs');
const YAML  = require('js-yaml');
const utils = require('loader-utils');

const defaultOptions = {
    keyword: 'import'
};

const read = (file) => {
    return new Promise((resolve, reject) => {
        readFile(file, (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data.toString());
        });
    });
};

const parseRootImports = (source, keyword, path) => {
    let oldLines = source.split('\n');
    let newLines = [];
    let deps = [];
    let promises = [];

    for (let i = 0; i < oldLines.length; i++) {
        const line  = oldLines[i];
        const regex = new RegExp(`^!${keyword}\\s+['"]?(.*\\.ya?ml)['"]?\\s*$`);
        const match = line.match(regex);
        
        if (match) {
            const filePath = join(path, match[1]);
            promises.push(
                read(filePath)
                    .then(data => parseRootImports(data, keyword, dirname(filePath)))
                    .then(result => {
                        deps.push(filePath, ...result.deps);
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

const parseImports = (source, keyword, path) => {
    return parseRootImports(source, keyword, path).then(({ lines, deps }) => {
        source = lines.join('\n');

        const type = new YAML.Type('!' + keyword, {
            kind: 'scalar',
            construct: uri => {
                const filePath = join(path, uri);
                return read(filePath)
                    .then(data => parseImports(data, keyword, dirname(filePath)))
                    .then(result => {
                        deps.push(filePath, ...result.deps);
                        return result.obj;
                    });
            }
        });

        const schema = YAML.Schema.create([type]);

        // Since the construct function in our type import is async we
        // are left with nested promises, these have to be resolved.
        return resolvePromises(YAML.safeLoad(source, { schema })).then(obj => ({ obj, deps }));
    });
};

function load(source) {
    this.cacheable && this.cacheable();
    const options  = Object.assign({}, defaultOptions, utils.getOptions(this));
    const callback = this.async();

    parseImports(source, options.keyword, dirname(this.resourcePath))
        .then(({ obj, deps }) => {
            for (let dep of deps)
                this.addDependency(dep);

            callback(null, YAML.safeDump(obj))
        })
        .catch(err => {
            this.emitError(err);
            callback(err, null);
        });
};

module.exports = load;
