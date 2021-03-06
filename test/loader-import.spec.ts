import { expect } from 'chai';

import * as loader from '../src';
import * as utils from './utils';

describe('loader !import <file>', () => {
    it('no change without import keywords', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./data/yaml/plain.yml', options);

        const { result, deps } = await utils.load(context, loader);

        expect(deps).eql([]);
        expect(result).eql({
            hello: 'world',
            test: 'a'
        });
    });

    it('allow root import', async () => {
        const options = { output: 'raw', importRoot: true };
        const context = await utils.context(
            './data/yaml/import/root.yml',
            options
        );

        const { result, deps } = await utils.load(context, loader);

        expect(deps).eql([utils.resolve('./data/yaml/plain.yml')]);
        expect(result).eql({
            hello: 'world',
            test: 'a',
            key: 'value'
        });
    });

    it('allow nested import', async () => {
        const options = { output: 'raw' };
        const context = await utils.context(
            './data/yaml/import/nested.yml',
            options
        );

        const { result, deps } = await utils.load(context, loader);

        expect(deps).eql([utils.resolve('./data/yaml/plain.yml')]);
        expect(result).eql({
            value: {
                hello: 'world',
                test: 'a'
            }
        });
    });

    it('allow mixed import', async () => {
        const options = { output: 'raw', importRoot: true };
        const context = await utils.context(
            './data/yaml/import/mixed.yml',
            options
        );

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(3);
        expect(deps).contain(utils.resolve('./data/yaml/import/nested.yml'));
        expect(deps).contain(utils.resolve('./data/yaml/array.yml'));
        expect(deps).contain(utils.resolve('./data/yaml/plain.yml'));

        expect(result).eql({
            value: {
                hello: 'world',
                test: 'a'
            },
            other: ['value1', 'value2', 'value3']
        });
    });

    it('allow path navigation', async () => {
        const options = { output: 'raw', importRoot: true };
        const context = await utils.context(
            './data/yaml/folder/path.yml',
            options
        );

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(3);
        expect(deps).contain(utils.resolve('./data/yaml/folder/key/key.yml'));
        expect(deps).contain(utils.resolve('./data/yaml/folder/key/value.yml'));
        expect(deps).contain(utils.resolve('./data/yaml/folder/value.yml'));

        expect(result).eql({
            key1: 'value1',
            key2: 'value2'
        });
    });

    it('allow json import', async () => {
        const options = { output: 'raw', importRoot: true };
        const context = await utils.context(
            './data/yaml/import/json.yml',
            options
        );

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(2);
        expect(deps).contain(utils.resolve('./data/json/map.json'));
        expect(deps).contain(utils.resolve('./data/json/array.json'));

        expect(result).eql({
            jsonKey1: 'jsonValue1',
            jsonKey2: 'jsonValue2',
            nested: {
                jsonKey1: 'jsonValue1',
                jsonKey2: 'jsonValue2'
            },
            array: ['elem1', 'elem2']
        });
    });
});
