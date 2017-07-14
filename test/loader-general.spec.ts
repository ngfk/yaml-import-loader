import { expect }  from 'chai';
import * as utils  from './utils';
import loader from '../src';

describe('general features', () => {

    it('support parsing directly', async () => {
        const path = await utils.resolve('./yaml/import/nested.yml');

        const result = await loader.parse(path);

        expect(result).eql({
            value: {
                hello: 'world',
                test: 'a'
            }
        });
    });

    it('YAML support comments', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./yaml/general/commented.yml', options);

        const { result } = await utils.load(context, loader);

        expect(result).eql({
            hello: 'world'
        });
    });

    it('YAML support anchors', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./yaml/general/anchor.yml', options);

        const { result } = await utils.load(context, loader);

        expect(result).eql({
            from: {
                username: 'me',
                email: 'me@example.com'
            },
            to: {
                username: 'me',
                email: 'me@example.com'
            },
            cc: 'me@example.com'
        });
    });

    it('YAML support inheritance', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./yaml/general/inheritance.yml', options);

        const { result } = await utils.load(context, loader);

        expect(result).eql({
            from: {
                username: 'me',
                email: 'me@example.com'
            },
            to: {
                username: 'spoofed',
                email: 'me@example.com'
            }
        });
    });

    it('YAML support folded scalar, block scalar, chomp modifier, indent modifier ', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./yaml/general/multiline.yml', options);

        const { result } = await utils.load(context, loader);

        expect(result).eql({
            street1: '123 Tornado Alley\nSuite 16\n',
            street2: '123 Tornado Alley\nSuite 16\n\n',
            street3: '123 Tornado Alley\nSuite 16',
            specialDelivery1: 'Follow the Yellow Brick Road to the Emerald City.\n',
            specialDelivery2: 'Follow the Yellow Brick Road to the Emerald City.\n\n',
            specialDelivery3: 'Follow the Yellow Brick Road to the Emerald City.'
        });
    });

    it('YAML support multi document sources ', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./yaml/general/multi-document.yml', options);

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(0);
        expect(result).eql([
            { document: 1 },
            { document: 2 },
            { document: 3 },
        ]);
    });
});
