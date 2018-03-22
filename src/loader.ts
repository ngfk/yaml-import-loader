import * as YAML from 'js-yaml';
import * as utils from 'loader-utils';

import { parse } from './parse';

async function load(this: any, source: string) {
    if (this.cacheable) this.cacheable();

    const callback = this.async();
    const userOptions = utils.getOptions(this);

    try {
        const context = await parse(source, this.resourcePath, userOptions);

        context.dependencies.forEach(dep => {
            if (!dep.startsWith('http://') && !dep.startsWith('https://'))
                this.addDependency(dep);
        });

        switch (context.options.output) {
            case 'json':
                callback(undefined, JSON.stringify(context.output));
                break;
            case 'yaml':
            case 'yml':
                callback(undefined, YAML.safeDump(context.output));
                break;
            case 'raw':
                callback(undefined, context.output);
                break;
            default:
                const json = JSON.stringify(context.output);
                callback(undefined, `module.exports = ${json};`);
                break;
        }
    } catch (err) {
        this.emitError(err);
        callback(err, undefined);
    }
}

export interface YamlImportLoader {
    (source: string): void;
    parse: parse;
}

const loader: any = load;
loader.parse = parse;
loader.default = loader;

export default loader as YamlImportLoader;
