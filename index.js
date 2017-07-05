const path  = require('path');
const fs    = require('fs');
const YAML  = require('js-yaml');
const utils = require('loader-utils');

const defaultOptions = {
    keyword: 'import'
};

const parseDirect = (source, keyword) => {
    let oldLines = source.split('\n');
    let newLines = [];
    let deps     = [];

    for (let i = 0; i < oldLines.length; i++) {
        let line  = oldLines[i];
        let regex = new RegExp(`^!${keyword}\\s+['"]?(.*\\.ya?ml)['"]?\\s*$`);
        let match = line.match(regex);
        
        if (match) {
            const location  = path.resolve(match[1]);
            const data      = fs.readFileSync(location).toString();
            const subResult = parseDirect(data, keyword);

            deps.push(location, ...subResult.deps);
            newLines.push(...subResult.lines);
        }
        else
            newLines.push(line);
    }

    return { lines: newLines, deps };
};

const parse = (source, keyword) => {
    let deps = [];

    const subResult = parseDirect(source, keyword);
    deps.push(...subResult.deps);
    source = subResult.lines.join('\n');

    const type = new YAML.Type('!' + keyword, {
        kind: 'scalar',
        construct: uri => {
            // TODO: how to make this async?
            const location  = path.resolve(uri);
            const data      = fs.readFileSync(location).toString();
            const subResult = parse(data, keyword);

            deps.push(location, ...subResult.deps);
            return subResult.obj;
        }
    });

    const obj = YAML.safeLoad(source, {
        schema: YAML.Schema.create([type])
    });

    return { obj, deps };
};

function load(source) {
    this.cacheable && this.cacheable();
    const options = Object.assign({}, defaultOptions, utils.getOptions(this));
    const callback = this.async();

    try {
        const { obj, deps } = parse(source, options.keyword);
        for (let dep of deps)
            this.addDependency(dep);

        callback(null, YAML.safeDump(obj))
    }
    catch (err) {
        this.emitError(err);
        callback(err, null);
    }
};

module.exports = load;
