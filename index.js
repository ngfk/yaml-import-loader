const path    = require('path');
const fs      = require('fs');
const jsyaml  = require('js-yaml');

const parse = (source) => {
    let deps = [];

    const type = new jsyaml.Type('!import', {
        kind: 'scalar',
        construct: uri => {
            const location  = path.resolve(uri);
            const data      = fs.readFileSync(location);
            const subResult = parse(data);

            deps.push(location, ...subResult.deps);
            return subResult.obj;
        }
    });

    const obj = jsyaml.safeLoad(source, {
        schema: jsyaml.Schema.create([type])
    });

    return { obj, deps };
};

function load(source) {
    this.cacheable && this.cacheable();

    try {
        const { obj, deps } = parse(source);
        for (let dep of deps)
            this.addDependency(dep);

        return JSON.stringify(obj);
    }
    catch (err) {
        this.emitError(err);
        return null;
    }
};


module.exports = load;
