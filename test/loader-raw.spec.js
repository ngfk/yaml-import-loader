const { expect } = require('chai');
const utils = require('./utils');
const loader = require('../index');

describe('loader raw', () => {

    it('allow raw root import', () => {
        return utils.context('./yaml/raw/root.yml', { output: 'raw' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                expect(result).eq('\n<div>Hello World!</div>\n');
            });
    });

    it('allow raw nested import', () => {
        return utils.context('./yaml/raw/nested.yml', { output: 'raw' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                expect(result).eql({
                    html: '\n<div>Hello World!</div>\n'
                });
            });
    });

    it('allow raw mixed import', () => {
        return utils.context('./yaml/raw/mixed.yml', { importRoot: true, output: 'raw' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                expect(result).eql({
                    value: {
                        hello: 'world',
                        test: 'a'
                    },
                    html: '\n<div>Hello World!</div>\n'
                });
            });
    });
});
