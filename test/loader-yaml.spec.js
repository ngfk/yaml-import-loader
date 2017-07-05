const path = require('path');
const { expect } = require('chai');
const utils = require('./utils');
const loader = require('../index');

describe('loader yaml', () => {

    it('no change without import keywords', () => {
        return utils.context('./yaml/plain.yml')
            .then(context => utils.load(context, loader))
            .then(({ result, deps, source }) => {
                expect(result).eq(source);
                expect(deps).eql([]);
            });
    });

    it('allow root import', () => {
        return utils.context('./yaml/root.yml')
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(deps).eql([
                    utils.resolve('./yaml/plain.yml')
                ]);

                return utils.read('./yaml/plain.yml').then(check => {
                    expect(result).eq(check);
                });
            });
    });

    it('allow nested import', () => {
        return utils.context('./yaml/nested.yml')
            .then(context => utils.load(context, loader))
            .then(({ result, deps }) => {
                expect(result).eq([
                    'value:',
                    '  hello: world',
                    '  test: a',
                    ''
                ].join('\n'));
                
                expect(deps).eql([
                    utils.resolve('./yaml/plain.yml')
                ]);
            });
    });
});
