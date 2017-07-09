import * as fs from 'fs';
import * as path from 'path';

const DEPENDENCIES = Symbol('dependencies');
const DONE = Symbol('done');
const DATA = Symbol('data');

class Context {

    public resourcePath: string;
    public query: any;

    constructor() {
        (this as any)[DEPENDENCIES] = [];
        this.resourcePath = path.resolve(__dirname, __filename);
    }

    public callback(error: any, result: string) {
        (this as any)[DONE](error, result, (this as any)[DEPENDENCIES]);
    }

    public async() {
        return (error: any, result: string) => this.callback(error, result);
    }

    public addDependency(dependency: string) {
        (this as any)[DEPENDENCIES].push(dependency);
    }

    public emitError() {
        // Do nothing
    }
}

export const load = (ctx: Context, loader: any) => {
    return new Promise<{ result: string, deps: string[], source: string }>((res, rej) => {
        (ctx as any)[DONE] = (e: any, r: string, d: string[]) => {
            if (e)
                rej(e);
            else {
                res({
                    result: r,
                    deps: d,
                    source: (ctx as any)[DATA]
                });
            }
        };
        loader.call(ctx, (ctx as any)[DATA]);
    });
};

export const context = async <T extends {}>(file: string, options: T): Promise<Context> => {
    const filePath = path.resolve(__dirname, file);
    const data = await read(filePath);

    let ctx = new Context();
    ctx.resourcePath = filePath;
    ctx.query = options;
    (ctx as any)[DATA] = data.toString();
    return ctx;
};

export const read = (file: string): Promise<string> => {
    return new Promise<string>((res, rej) => {
        fs.readFile(path.resolve(__dirname, file), (err, data) => {
            if (err)
                rej(err);
            else
                res(data.toString());
        });
    });
};

export const resolve = (file: string): string => path.resolve(__dirname, file);
