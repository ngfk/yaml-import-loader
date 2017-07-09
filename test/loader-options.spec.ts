import { expect }  from 'chai';
import * as utils  from './utils';
import * as loader from '../src';
import * as YAML   from 'js-yaml';

describe('loader options', () => {

    it('allow custom types', async () => {
        // Example from https://github.com/nodeca/js-yaml/blob/master/examples/custom_types.js
        class Point {
            constructor (
                public x: number,
                public y: number,
                public z: number) { }
        }

        class Space {
            constructor (
                public height: number,
                public width: number,
                public points: Point[]
            ) {
                if (points) {
                    if (!points.every((point: Point) => { return point instanceof Point; }))
                        throw new Error('A non-Point inside a points array!');
                }
            }
        }

        const options: loader.Options = {
            importRoot: true,
            output: 'raw',
            parser: {
                types: [
                    new YAML.Type('!point', {
                        kind: 'sequence',
                        resolve: (data: number[]) => {
                            // tslint:disable-next-line no-null-keyword
                            return data !== null && data.length === 3;
                        },
                        construct: (data: number[]) => {
                            return new Point(data[0], data[1], data[2]);
                        },
                        instanceOf: Point,
                        represent: (point: any) => {
                            return [point.x, point.y, point.z];
                        }
                    }),
                    new YAML.Type('!space', {
                        kind: 'mapping',
                        construct: (data: any) => {
                            data = data || {};
                            return new Space(data.height || 0, data.width || 0, data.points || []);
                        },
                        instanceOf: Space
                    })
                ],
            }
        };
        const context = await utils.context('./yaml/options/custom_types.yml', options);

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(0);
        expect(result).eql({
            subject: 'Custom types in JS-YAML',
            spaces: [
                {
                    height: 1000,
                    width: 1000,
                    points: [
                        { x: 10, y: 43, z: 23 },
                        { x: 165, y: 0, z: 50 },
                        { x: 100, y: 100, z: 100 }
                    ]
                },
                {
                    height: 64,
                    width: 128,
                    points: [
                        { x: 12, y: 43, z: 0 },
                        { x: 1, y: 4, z: 90 }
                    ]
                },
                {
                    height: 0,
                    width: 0,
                    points: []
                }
            ]
        });
    });

    it ('allow custom async types', async () => {
        class Async {
            constructor (
                public delay: number,
                public result: any) { } // tslint:disable-line no-shadowed-variable
        }

        const options: loader.Options = {
            importRoot: true,
            output: 'raw',
            parser: {
                types: [
                    ctx => new YAML.Type('!async', {
                        kind: 'mapping',
                        resolve: (data: Async) => {
                            // tslint:disable-next-line no-null-keyword
                            return data !== null && typeof data.delay === 'number';
                        },
                        construct: async (data: Async) => {
                            ctx.resolveAsync = true;
                            await new Promise(resolve => { setTimeout(() => resolve(), data.delay); });
                            return data.result;
                        },
                        instanceOf: String
                    })
                ]
            }
        };
        const context = await utils.context('./yaml/options/async_type.yml', options);

        const { result, deps } = await utils.load(context, loader);

        expect(deps.length).eq(0);
        expect(result).eql({
            result: 'I am resolved after 2 ms!'
        });
    });

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

    it('allow yml output', async () => {
        const options = { importRoot: true, output: 'yml' };
        const context = await utils.context('./yaml/plain.yml', options);

        const { result } = await utils.load(context, loader);
        const exported = YAML.safeLoad(result);

        expect(exported).eql({
            hello: 'world',
            test: 'a',
        });
    });

    it('allow duplicate keys by default', async () => {
        const options = { importRoot: true, output: 'raw' };
        const context = await utils.context('./yaml/options/duplicate.yml', options);

        const { result } = await utils.load(context, loader);

        expect(result).eql({ key: 'new value', });
    });

    it('allow disabling duplicate keys', async () => {
        const options = { importRoot: true, output: 'raw', parser: { allowDuplicate: false } };
        const context = await utils.context('./yaml/options/duplicate.yml', options);

        return utils.load(context, loader)
            .then(() => expect(false).eq(true))
            .catch(err => {
                expect(err).instanceOf(YAML.YAMLException);
                expect(err.reason).eq('duplicated mapping key');
            });
    });
});
