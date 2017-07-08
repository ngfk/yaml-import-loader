import { expect }  from 'chai';
import * as YAML   from 'js-yaml';
import * as utils  from './utils';
import * as loader from '../src';

describe('loader resolving', () => {

    it('auto append yml extension', async () => {
        const options = { output: 'raw', importRoot: true };
        const context = await utils.context('./yaml/resolve/resolve_yml.yaml', options);

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(1);
        expect(deps).contain(utils.resolve('./yaml/plain.yml'));

        expect(result).eql({
            hello: 'world',
            test: 'a'
        });
    });

    it('auto append yaml extension', async () => {
        const options = { output: 'raw', importRoot: true };
        const context = await utils.context('./yaml/resolve/resolve_yaml.yml', options);

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(2);
        expect(deps).contain(utils.resolve('./yaml/resolve/resolve_yml.yaml'));
        expect(deps).contain(utils.resolve('./yaml/plain.yml'));

        expect(result).eql({
            hello: 'world',
            test: 'a'
        });
    });

    it('auto append json extension', async () => {
        const options = { output: 'raw', importRoot: true };
        const context = await utils.context('./yaml/resolve/resolve_json.yml', options);

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(1);
        expect(deps).contain(utils.resolve('./json/array.json'));

        expect(result).a('array');
        expect(result.length).eq(2);
        expect(result).contain('elem1');
        expect(result).contain('elem2');
    });

    it('allow resolve from module', async () => {
        const options = { output: 'raw', importRoot: true };
        const context = await utils.context('./yaml/resolve/resolve_module.yml', options);
        const modulePath = require.resolve('mocha/lib/browser/.eslintrc.yaml');
        const moduleCont = YAML.safeLoad(await utils.read(modulePath));

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(1);
        expect(deps).contain(modulePath);
        expect(result).eql({
            result: moduleCont
        });
    });
});
