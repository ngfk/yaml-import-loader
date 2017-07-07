const { expect } = require('chai');
const utils = require('./utils');
const loader = require('../index');
const YAML = require('js-yaml');

describe('loader output', () => {

    it('default output should be exported js object', () => {
        return utils.context('./yaml/plain.yml', { importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                expect(result).eql(`module.exports = ${JSON.stringify({
                    hello: 'world',
                    test: 'a',
                })};`);
            });
    });

    it('allow json output', () => {
        return utils.context('./yaml/plain.yml', { importRoot: true, output: 'json' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                expect(result).eql(JSON.stringify({
                    hello: 'world',
                    test: 'a',
                }));
            });
    });

    it('allow yaml output', () => {
        return utils.context('./yaml/plain.yml', { importRoot: true, output: 'yaml' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                expect(result).eql(YAML.safeDump({
                    hello: 'world',
                    test: 'a',
                }));
            });
    });
});
