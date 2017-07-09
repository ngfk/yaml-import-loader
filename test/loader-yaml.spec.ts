import { expect }  from 'chai';
import * as utils  from './utils';
import * as loader from '../src';

describe('YAML features', () => {

    it('support comments', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./yaml/yaml/commented.yml', options);

        const { result } = await utils.load(context, loader);

        expect(result).eql({
            hello: 'world'
        });
    });

    it('support anchors', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./yaml/yaml/anchor.yml', options);

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

    it('support inheritance', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./yaml/yaml/inheritance.yml', options);

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

    it('support folded scalar, block scalar, chomp modifier, indent modifier ', async () => {
        const options = { output: 'raw' };
        const context = await utils.context('./yaml/yaml/multiline.yml', options);

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
});
