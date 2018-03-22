import * as YAML from 'js-yaml';

import { Context } from './context';

const defaultOptions: InternalOptions = {
    importRoot: false,
    importNested: true,
    importKeyword: 'import',
    importRawKeyword: 'import-raw',
    output: 'object',
    parser: {
        types: [],
        schema: YAML.SAFE_SCHEMA,
        allowDuplicate: true,
        onWarning: undefined
    }
};

export interface BaseOptions {
    /**
     * Allows the use of the `!import <file>` type without assigning it to a
     * key. Using this will cause the target's file content to be inserted at
     * the import location. Defaults to `false`.
     */
    importRoot: boolean;

    /**
     * Allows the use of the `!import <file>` type with assigned to a key.
     * Settings this and the `importRoot` options to false will result in a
     * regular yaml-loader. Defaults to `true`.
     */
    importNested: boolean;

    /**
     * The import keyword used for yaml/json content. Defaults to `import`.
     */
    importKeyword: string;

    /**
     * The import-raw keyword used for raw file content. Defaults to
     * `import-raw`.
     */
    importRawKeyword: string;

    /**
     * The output type. Can be `object`, `json`, or `yaml`. Defaults to
     * `object`.
     */
    output: 'object' | 'json' | 'yaml' | 'yml' | 'raw';
}

export interface InternalOptions extends BaseOptions {
    parser: InternalParserOptions;
}

export interface InternalParserOptions {
    /**
     * Custom types to be used by the parser.
     */
    types: (((context: Context) => YAML.Type) | YAML.Type)[];

    /**
     * The base schema to extend, can be an array of schemas. Defaults to
     * `SAFE_SCHEMA` from `js-yaml`.
     */
    schema: YAML.Schema | YAML.Schema[] | undefined;

    /**
     * Allows duplicate keys to be used. The old value of a duplicate key will
     * be overwritten by the new value (`json` option in `js-yaml`). Defaults to
     * `true`.
     */
    allowDuplicate: boolean;

    /**
     * The function to call on warning messages. By default the parser will
     * throw on warnings.
     */
    onWarning?: ((error: YAML.YAMLException) => void);
}

export interface Options extends Partial<BaseOptions> {
    /**
     * The parser options which are passed to `js-yaml`.
     */
    parser?: ParserOptions;
}

export interface ParserOptions extends Partial<InternalParserOptions> {}

/**
 * Merges the specified user options with the default options to create a
 * complete options object.
 * @param userOptions The user defined options
 * @param defaultOutput The default output type
 */
export const getOptions = (
    userOptions: Options,
    defaultOutput?: Options['output']
): InternalOptions => {
    return {
        ...defaultOptions,
        output: defaultOutput ? defaultOutput : defaultOptions.output,
        ...userOptions,
        parser: { ...defaultOptions.parser, ...userOptions.parser }
    };
};
