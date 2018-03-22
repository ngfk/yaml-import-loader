import { basename, dirname } from 'path';

import { InternalOptions } from './options';

export class Context {
    public input: string;
    public output: any;
    public dependencies: Set<string>;

    public path: string;
    public directory: string;
    public filename: string;

    public options: InternalOptions;
    public resolveAsync: boolean;

    constructor(input: string, path: string, options: InternalOptions) {
        this.input = input;
        this.output = {};
        this.dependencies = new Set<string>();

        this.path = path;
        this.directory = dirname(path);
        this.filename = basename(path);

        this.options = options;
        this.resolveAsync = false;
    }
}
