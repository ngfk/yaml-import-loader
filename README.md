# yaml-import-loader

YAML loader for [Webpack](https://webpack.js.org) supporting the `!import <file>` type to include different YAML files, and `!import-raw <file>` to include the raw contents of a file.

[![NPM version](https://img.shields.io/npm/v/yaml-import-loader.svg)](https://www.npmjs.com/package/yaml-import-loader)
[![Downloads](https://img.shields.io/npm/dt/yaml-import-loader.svg)](https://www.npmjs.com/package/yaml-import-loader)
[![Build Status](https://travis-ci.org/ngfk/yaml-import-loader.svg?branch=master)](https://travis-ci.org/ngfk/yaml-import-loader)

## Installation
```
npm install --save-dev yaml-import-loader
```

## Usage

### Input files
```yaml
### ./main.yml

# Root import
# Note: this only works if importRoot is set to true
!import ./hello_world.yml
!import ./old.json

# Nested imports
key1: !import ./hello_world.yml
key2: !import ./array.yml
key3: !import ./old.json
html: !import-raw ./plain.html

### ./hello_world.yml
hello: world

### ./array.yml
- elem1
- elem2

### ./old.json
{
  "jsonKey": "jsonValue"
}
```
```html
<!-- plain.html -->
<div>Hey!</div>
<p>
  Some paragraph...
</p>
```

### JSON output
```json
{
  "hello": "world",
  "jsonKey": "jsonValue",  
  "key1": {
   "hello": "world"
  },
  "key2": [
    "elem1",
    "elem2"
  ],
  "key3": {
    "jsonKey": "jsonValue"
  },
  "html": "<!-- plain.html -->\n<div>Hey!</div>\n<p>\n  Some paragraph...\n</p>"
}
```

## Configuration

### webpack.config.js
```javascript
{
  module: {
    rules: [
      {
        test: /\.ya?ml$/,
        use: {
          loader: 'yaml-import-loader'
          
          // The options below are the default options
          options: {
            // Allows !import <file> without key. When using this the
            // targets file content will be inserted at the import location.
            importRoot: false,

            // Allows !import <file> with key. Set this and importRoot to
            // false for a regular yaml-loader.
            importNested: true,

            // The import keyword: `!${importKeyword} <file>` for
            // yaml/json contents
            importKeyword: 'import',

            // The import-raw keyword: `!${importKeyword} <file>` for
            // raw file contents
            importRawKeyword: 'import-raw',

            // Allows adding custom types, for details see below.
            types: [],

            // Output type. Can be 'object', 'json', or 'yaml'
            // 'object' -> exported js object
            // 'json'   -> stringified json
            // 'yaml'   -> stringified yaml
            output: 'object'
          }
        }
      },
    ]
  }
}
```

### Custom types

This loader internally uses [js-yaml](https://github.com/ngfk/js-yaml) as parser check their [wiki](https://github.com/nodeca/js-yaml/wiki/Custom-types) for custom type examples. The types array accepts `Type` objects or a function returning a `Type`. If you create your type in a function you will get some context in the first parameter, with this context you can instruct `yaml-import-loader` to resolve promises.

```javascript
const { Type } = require('js-yaml');

let types = [
  ctx => new Type('!async', {
    kind: 'mapping',
    resolve: (data) => {
      return data !== null && typeof data.delay === 'number';
    },
    construct: (data) => {
      ctx.resolveAsync = true;
      ctx.dependencies.add(data.watchThisFile);

      return new Promise(resolve => {
        setTimeout(() => resolve(data.result), data.delay);
      });
    },
    instanceOf: String
  })
];
```

```yaml
result: !async
  delay: 1000
  result: 'I will be resolved async after 1 second!'
  watchThisFile: './some/random/file/to/add/to/webpack/watch'
```

## Use cases

### Basic usage
```javascript
const yaml = require('./main.yml');

console.log(yaml.hello);
// world

console.log(JSON.stringify(yaml, undefined, 4));
// {
//   "hello": "world",
//   "jsonKey": "jsonValue",  
//   "key1": {
//    "hello": "world"
//   },
//   "key2": [
//     "elem1",
//     "elem2"
//   ],
//   "key3": {
//     "jsonKey": "jsonValue"
//   },
//   "html": "<div>Hey!</div>\n<p>\n  Some paragraph...\n</p>\n"
// }
```

### Examples
* Use ngx-translate, with yaml files, without a runtime loader.  
[ngx-translate-yaml](https://github.com/ngfk/ngx-translate-yaml)
