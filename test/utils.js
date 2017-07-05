'use strict';

const DEPENDENCIES = Symbol('dependencies');
const DONE = Symbol('done');

class Context {

    constructor(done) {
        this[DEPENDENCIES] = [];
        this[DONE] = done;
    }

    callback(error, result) {
        this[DONE](error, result, this[DEPENDENCIES]);
    }

    async() {
        return (e, r) => this.callback(e, r);
    }

    addDependency(dependency) {
        this[DEPENDENCIES].push(dependency);
    }

    emitError(error) {

    }
}

const load = (loader, source) => {
    return new Promise((resolve, reject) => {
        let context = new Context((e, r, d) => {
            if (e)
                reject(e);
            else
                resolve({ result: r, deps: d });
        });

        loader.call(context, source);
    });
};

module.exports = { load };
