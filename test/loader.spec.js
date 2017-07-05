const path       = require('path');
const { expect } = require('chai');
const mockfs     = require('mock-fs');
const { load }   = require('./utils');
const loader     = require('../index');

describe('loader', () => {

    const files = {
        'plain.yml': [
            'hello: world',
            'test: a',
            ''
        ].join('\n'),

        'root.yml': [
            '!import ./plain.yml',
            ''
        ].join('\n'),

        'nested.yml': [
            'value: !import ./plain.yml',
            ''
        ].join('\n'),

        'mixed.yml': [
            '!import ./nested.yml',
            ''
        ]
    }

    before(() => mockfs(files));
    after(() => mockfs.restore());
    
    it('no change without import keywords', () => {
        let execution = load(loader, files['plain.yml']);
        return execution.then(({ result, deps }) => {
            expect(result).eq(files['plain.yml']);
            expect(deps).eql([]);
        });
    });

    it('allow root import', () => {
        let execution = load(loader, files['root.yml']);
        return execution.then(({ result, deps }) => {
            expect(result).eq(files['plain.yml']);
            expect(deps).eql([
                path.resolve('plain.yml')
            ]);
        });
    });

    it('allow nested import', () => {
        let execution = load(loader, files['nested.yml']);
        return execution.then(({ result, deps }) => {
            expect(result).eq([
                'value:',
                '  hello: world',
                '  test: a',
                ''
            ].join('\n'));
            
            expect(deps).eql([
                path.resolve('plain.yml')
            ]);
        });
    });
});
