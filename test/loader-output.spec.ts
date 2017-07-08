import { expect }  from 'chai';
import * as utils  from './utils';
import * as loader from '../src';
import * as YAML   from 'js-yaml';

describe('loader output', () => {

    it('default output should be exported js object', async () => {
        const options = { importRoot: true };
        const context = await utils.context('./yaml/plain.yml', options);
        const start   = 'module.exports = ';
        const end     = ';';

        const { result } = await utils.load(context, loader);
        const exported = JSON.parse(result.substring(start.length, result.length - end.length));

        expect(result.startsWith(start)).eq(true);
        expect(result.endsWith(end)).eq(true);
        expect(exported).eql({
            hello: 'world',
            test: 'a',
        });
    });

    it('allow json output', async () => {
        const options = { importRoot: true, output: 'json' };
        const context = await utils.context('./yaml/plain.yml', options);

        const { result } = await utils.load(context, loader);
        const exported = JSON.parse(result);

        expect(exported).eql({
            hello: 'world',
            test: 'a',
        });
    });

    it('allow yaml output', async () => {
        const options = { importRoot: true, output: 'yaml' };
        const context = await utils.context('./yaml/plain.yml', options);

        const { result } = await utils.load(context, loader);
        const exported = YAML.safeLoad(result);

        expect(exported).eql({
            hello: 'world',
            test: 'a',
        });
    });
});
