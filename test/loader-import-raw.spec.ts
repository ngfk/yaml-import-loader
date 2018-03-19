import { expect } from 'chai';

import * as loader from '../src';
import * as utils from './utils';

describe('loader !import-raw <file>', () => {
    it('allow raw root import', async () => {
        const options = { importRoot: true, output: 'raw' };
        const context = await utils.context(
            './data/yaml/import-raw/root.yml',
            options
        );

        const { result } = await utils.load(context, loader);

        expect(result).eq('<div>Hello World!</div>\n<div>Hello World!</div>');
    });

    it('allow raw nested import', async () => {
        const options = { output: 'raw' };
        const context = await utils.context(
            './data/yaml/import-raw/nested.yml',
            options
        );

        const { result } = await utils.load(context, loader);

        expect(result).eql({
            plain:
                '<!-- plain.html -->\n\n<div>Hey!</div>\n<p>\n    Some paragraph...\n</p>\n',
            test: '\n<div>Hello World!</div>\n'
        });
    });

    it('allow raw mixed import', async () => {
        const options = { importRoot: true, output: 'raw' };
        const context = await utils.context(
            './data/yaml/import-raw/mixed.yml',
            options
        );

        const { result } = await utils.load(context, loader);

        expect(result).eql({
            value: {
                hello: 'world',
                test: 'a'
            },
            html: '\n<div>Hello World!</div>\n'
        });
    });
});
