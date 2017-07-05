const path  = require('path');
const fs    = require('fs');
const YAML  = require('js-yaml');
const utils = require('loader-utils');

const defaultOptions = {
    keyword: 'import'
};

const readFile = (file) => {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data.toString());
        });
    });
};

const parseRootImports = (source, keyword) => {
    let oldLines = source.split('\n');
    let newLines = [];
    let deps = [];
    let promises = [];

    for (let i = 0; i < oldLines.length; i++) {
        const line  = oldLines[i];
        const regex = new RegExp(`^!${keyword}\\s+['"]?(.*\\.ya?ml)['"]?\\s*$`);
        const match = line.match(regex);
        
        if (match) {
            const location = path.resolve(match[1]);
            promises.push(
                readFile(location)
                    .then(data => parseRootImports(data, keyword))
                    .then(result => {
                        deps.push(location, ...result.deps);
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

const parseImports = (source, keyword) => {
    return parseRootImports(source, keyword).then(subResult => {
        let deps = [];
        deps.push(...subResult.deps);
        source = subResult.lines.join('\n');

        const type = new YAML.Type('!' + keyword, {
            kind: 'scalar',
            construct: uri => {
                const location = path.resolve(uri);
                return readFile(location)
                    .then(data => parseImports(data, keyword))
                    .then(result => {
                        deps.push(location, ...result.deps);
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

    parseImports(source, options.keyword)
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
