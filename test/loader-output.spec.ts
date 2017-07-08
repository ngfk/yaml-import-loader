import { expect }  from 'chai';
import * as utils  from './utils';
import * as loader from '../src';
import * as YAML   from 'js-yaml';

describe('loader output', () => {

    it('default output should be exported js object', () => {
        return utils.context('./yaml/plain.yml', { importRoot: true })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                const start    = 'module.exports = ';
                const end      = ';';
                const exported = JSON.parse(result.substring(start.length, result.length - end.length));

                expect(result.startsWith(start)).eq(true);
                expect(result.endsWith(end)).eq(true);
                expect(exported).eql({
                    hello: 'world',
                    test: 'a',
                });
            });
    });

    it('allow json output', () => {
        return utils.context('./yaml/plain.yml', { importRoot: true, output: 'json' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                const exported = JSON.parse(result);

                expect(exported).eql({
                    hello: 'world',
                    test: 'a',
                });
            });
    });

    it('allow yaml output', () => {
        return utils.context('./yaml/plain.yml', { importRoot: true, output: 'yaml' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                const exported = YAML.safeLoad(result);

                expect(exported).eql({
                    hello: 'world',
                    test: 'a',
                });
            });
    });
});
