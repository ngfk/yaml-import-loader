const path = require('path');
const { expect } = require('chai');
const utils = require('./utils');
const loader = require('../index');
const YAML = require('js-yaml');

describe('loader output', () => {

    it('default output should be javascript object', () => {
        return utils.context('./yaml/mixed.yml', { importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
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
    });

    it('allow json output', () => {
        return utils.context('./yaml/plain.yml', { importRoot: true, output: 'json' })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(result).eql(JSON.stringify({
                    hello: 'world',
                    test: 'a',
                }));
            });
    });

    it('allow yaml output', () => {
        return utils.context('./yaml/plain.yml', { importRoot: true, output: 'yaml' })
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(result).eql(YAML.safeDump({
                    hello: 'world',
                    test: 'a',
                }));
            });
    });
});
