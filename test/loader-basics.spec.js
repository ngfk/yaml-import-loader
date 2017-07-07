const { expect } = require('chai');
const utils = require('./utils');
const loader = require('../index');

describe('loader basics', () => {

    it('no change without import keywords', () => {
        return utils.context('./yaml/plain.yml', { output: 'raw' })
            .then(context => utils.load(context, loader))
            .then(({ result, deps, source }) => {
                expect(deps).eql([]);
                expect(result).eql({
                    hello: 'world',
                    test: 'a'
                });
            });
    });

    it('allow root import', () => {
        return utils.context('./yaml/root.yml', { output: 'raw', importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(deps).eql([
                    utils.resolve('./yaml/plain.yml')
                ]);
                expect(result).eql({
                    hello: 'world',
                    test: 'a',
                    key: 'value'
                });
            });
    });

    it('allow nested import', () => {
        return utils.context('./yaml/nested.yml', { output: 'raw' })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(deps).eql([
                    utils.resolve('./yaml/plain.yml')
                ]);
                expect(result).eql({
                    value: {
                        hello: 'world',
                        test: 'a'
                    }
                });
            });
    });

    it('allow mixed import', () => {
        return utils.context('./yaml/mixed.yml', { output: 'raw', importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(deps.length).eq(3);
                expect(deps).contain(utils.resolve('./yaml/nested.yml'));
                expect(deps).contain(utils.resolve('./yaml/array.yml'));
                expect(deps).contain(utils.resolve('./yaml/plain.yml'));
                
                expect(result).eql({
                    value: {
                        hello: 'world',
                        test: 'a'
                    },
                    other: [
                        'value1',
                        'value2',
                        'value3',
                    ]
                });
            });
    });

    it('allow path navigation', () => {
        return utils.context('./yaml/folder/path.yml', { output: 'raw', importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(deps.length).eq(3);
                expect(deps).contain(utils.resolve('./yaml/folder/key/key.yml'));
                expect(deps).contain(utils.resolve('./yaml/folder/key/value.yml'));
                expect(deps).contain(utils.resolve('./yaml/folder/value.yml'));

                expect(result).eql({
                    key1: 'value1',
                    key2: 'value2'
                });
            });
    });

    it('allow json import', () => {
        return utils.context('./yaml/json.yml', { output: 'raw', importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(deps.length).eq(2);
                expect(deps).contain(utils.resolve('./json/map.json'));
                expect(deps).contain(utils.resolve('./json/array.json'));

                expect(result).eql({
                    jsonKey1: 'jsonValue1',
                    jsonKey2: 'jsonValue2',
                    nested: {
                        jsonKey1: 'jsonValue1',
                        jsonKey2: 'jsonValue2'
                    },
                    array: [
                        'elem1',
                        'elem2'
                    ]
                });
            });
    });

    it('auto append yml extension', () => {
        return utils.context('./yaml/auto_yml.yaml', { output: 'raw', importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(deps.length).eq(1);
                expect(deps).contain(utils.resolve('./yaml/plain.yml'));

                expect(result).eql({
                    hello: 'world',
                    test: 'a'
                });
            });
    });

    it('auto append yaml extension', () => {
        return utils.context('./yaml/auto_yaml.yml', { output: 'raw', importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(deps.length).eq(2);
                expect(deps).contain(utils.resolve('./yaml/auto_yml.yaml'));
                expect(deps).contain(utils.resolve('./yaml/plain.yml'));

                expect(result).eql({
                    hello: 'world',
                    test: 'a'
                });
            });
    });

    it('auto append json extension', () => {
        return utils.context('./yaml/auto_json.yml', { output: 'raw', importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(deps.length).eq(1);
                expect(deps).contain(utils.resolve('./json/array.json'));

                expect(result).a('array');
                expect(result.length).eq(2);
                expect(result).contain('elem1');
                expect(result).contain('elem2');
            });
    });
});
