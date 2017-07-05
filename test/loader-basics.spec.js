const path = require('path');
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
                expect(deps).eql([
                    utils.resolve('./yaml/plain.yml'),
                    utils.resolve('./yaml/nested.yml'),
                    utils.resolve('./yaml/array.yml'),
                ]);
                expect(result).eql({
                    hello: 'world',
                    test: 'a',
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
    })
});
