import { expect }  from 'chai';
import * as YAML   from 'js-yaml';
import * as mockre from 'mock-require';
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


    it('allow resolve from http', async () => {
        const { EventEmitter } = await import('events');
        const yamlUri = 'http://test.com/yaml/plain.yml';
        const htmlUri = 'http://test.com/html/plain.html';
        const yamlContent = await utils.read('./yaml/plain.yml');
        const htmlContent = await utils.read('./html/plain.html');

        mockre('http', {
            get: (uri: string, cb: Function) => {
                let emitter = new EventEmitter();

                expect(uri === yamlUri || uri === htmlUri).eq(true);
                expect(cb).a('function');

                cb(emitter);
                emitter.emit('data', uri === yamlUri ? yamlContent : htmlContent);
                emitter.emit('end');
            }
        });

        const options = { output: 'raw', importRoot: true };
        const context = await utils.context('./yaml/resolve/resolve_http.yml', options);

        const { result, deps } = await utils.load(context, loader);
        expect(deps.length).eq(0);
        expect(result).eql({
            import: {
                hello: 'world',
                test: 'a'
            },
            importRaw: '<!-- plain.html -->\n\n<div>Hey!</div>\n<p>\n    Some paragraph...\n</p>\n'
        });

        mockre.stop('http');
    });

    it('allow resolve from https', async () => {
        const { EventEmitter } = await import('events');
        const yamlUri = 'https://test.com/yaml/plain.yml';
        const htmlUri = 'https://test.com/html/plain.html';
        const yamlContent = await utils.read('./yaml/plain.yml');
        const htmlContent = await utils.read('./html/plain.html');

        mockre('https', {
            get: (uri: string, cb: Function) => {
                let emitter = new EventEmitter();

                expect(uri === yamlUri || uri === htmlUri).eq(true);
                expect(cb).a('function');

                cb(emitter);
                emitter.emit('data', uri === yamlUri ? yamlContent : htmlContent);
                emitter.emit('end');
            }
        });

        const options = { output: 'raw', importRoot: true };
        const context = await utils.context('./yaml/resolve/resolve_https.yml', options);

        const { result, deps } = await utils.load(context, loader);
        expect(deps.length).eq(0);
        expect(result).eql({
            import: {
                hello: 'world',
                test: 'a'
            },
            importRaw: '<!-- plain.html -->\n\n<div>Hey!</div>\n<p>\n    Some paragraph...\n</p>\n'
        });

        mockre.stop('https');
    });
});
