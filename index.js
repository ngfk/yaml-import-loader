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

const parseRootImports = async (source, keyword) => {
    let oldLines = source.split('\n');
    let newLines = [];
    let deps = [];

    for (let i = 0; i < oldLines.length; i++) {
        let line  = oldLines[i];
        let regex = new RegExp(`^!${keyword}\\s+['"]?(.*\\.ya?ml)['"]?\\s*$`);
        let match = line.match(regex);
        
        if (match) {
            const location  = path.resolve(match[1]);
            const data      = await readFile(location);
            const subResult = await parseRootImports(data, keyword);

            deps.push(location, ...subResult.deps);
            newLines.push(...subResult.lines);
        }
        else
            newLines.push(line);
    }

    return { lines: newLines, deps };
};

const resolvePromises = async (value) => {    
    if (value instanceof Promise)
        return await value;
    if (value instanceof Array)
        return await Promise.all(value.map(async entry => await resolvePromises(entry)));
    
    if (typeof value === 'object') {
        for (let key in value)
            value[key] = await resolvePromises(value[key]);
    }

    return value;
};

const parseImports = async (source, keyword) => {
    let deps = [];

    const subResult = await parseRootImports(source, keyword);
    deps.push(...subResult.deps);
    source = subResult.lines.join('\n');

    const type = new YAML.Type('!' + keyword, {
        kind: 'scalar',
        construct: async uri => {
            const location  = path.resolve(uri);
            const data      = await readFile(location);
            const subResult = await parseImports(data, keyword);

            deps.push(location, ...subResult.deps);
            return subResult.obj;
        }
    });

    let obj = YAML.safeLoad(source, {
        schema: YAML.Schema.create([type])
    });

    // Since the construct function in our type is async we are
    // left with promises, these have to be resolved.
    obj = await resolvePromises(obj);

    return { obj, deps };
};

function load(source) {
    this.cacheable && this.cacheable();
    const options = Object.assign({}, defaultOptions, utils.getOptions(this));
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
