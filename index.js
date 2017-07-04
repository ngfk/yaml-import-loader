const path  = require('path');
const fs    = require('fs');
const YAML  = require('js-yaml');
const utils = require('loader-utils');

const defaultOptions = {
    keyword: 'import'
};

const parse = (source, keyword) => {
    let deps = [];

    const type = new YAML.Type('!' + keyword, {
        kind: 'scalar',
        construct: uri => {
            const location  = path.resolve(uri);
            const data      = fs.readFileSync(location);
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

    try {
        const { obj, deps } = parse(source, options.keyword);
        for (let dep of deps)
            this.addDependency(dep);

        return YAML.safeDump(obj);
    }
    catch (err) {
        this.emitError(err);
        return null;
    }
};

module.exports = load;
