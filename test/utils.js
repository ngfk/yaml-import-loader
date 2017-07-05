const fs = require('fs');
const path = require('path');

const DEPENDENCIES = Symbol('dependencies');
const DONE = Symbol('done');
const DATA = Symbol('data');

class Context {

    constructor(done) {
        this[DEPENDENCIES] = [];
        this.resourcePath = path.resolve(__dirname, __filename);
    }

    callback(error, result) {
        this[DONE](error, result, this[DEPENDENCIES]);
    }

    async() {
        return (...args) => this.callback(...args);
    }

    addDependency(dependency) {
        this[DEPENDENCIES].push(dependency);
    }

    emitError(error) {

    }
}

const load = (context, loader) => {
    return new Promise((resolve, reject) => {
        context[DONE] = (e, r, d) => {
            if (e)
                reject(e);
            else {
                resolve({
                    result: r,
                    deps: d,
                    source: context[DATA]
                });
            }
        };

        loader.call(context, context[DATA]);
    });
};

const context = (file, options = {}) => {
    let filePath = path.resolve(__dirname, file);
    return read(filePath).then(data => {
        let context = new Context();
        context.resourcePath = filePath;
        context.query = options;
        context[DATA] = data.toString();
        return context;
    });
}

const read = (file) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(__dirname, file), (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data.toString());
        });
    });
}

const resolve = (file) => path.resolve(__dirname, file);

module.exports = { load, context, read, resolve };
