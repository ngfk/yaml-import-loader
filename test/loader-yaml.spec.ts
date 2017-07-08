import { expect }  from 'chai';
import * as utils  from './utils';
import * as loader from '../src';

describe('YAML features', () => {

    it('support comments', () => {
        return utils.context('./yaml/commented.yml', { output: 'raw' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                expect(result).eql({
                    hello: 'world'
                });
            });
    });

    it('support anchors', () => {
        return utils.context('./yaml/anchor.yml', { output: 'raw' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
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
    });

    it('support inheritence', () => {
        return utils.context('./yaml/inheritance.yml', { output: 'raw' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
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
    });

    it('support folded scalar, block scalar, chomp modifier, indent modifier ', () => {
        return utils.context('./yaml/multiline.yml', { output: 'raw' })
            .then(context => utils.load(context, loader))
            .then(({ result }) => {
                expect(result).eql({
                    street1: '123 Tornado Alley\nSuite 16\n',
                    street2: '123 Tornado Alley\nSuite 16\n\n',
                    street3: '123 Tornado Alley\nSuite 16',
                    specialDelivery1: 'Follow the Yellow Brick Road to the Emerald City. Pay no attention to the man behind the curtain.\n',
                    specialDelivery2: 'Follow the Yellow Brick Road to the Emerald City. Pay no attention to the man behind the curtain.\n\n',
                    specialDelivery3: 'Follow the Yellow Brick Road to the Emerald City. Pay no attention to the man behind the curtain.'
                });
            });
    });
});
