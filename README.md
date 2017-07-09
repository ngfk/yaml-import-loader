# yaml-import-loader

A customizable YAML loader for [Webpack](https://webpack.js.org) supporting the `!import <file>` type to include different YAML files, and `!import-raw <file>` type to include the raw contents of any file.

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
local:  !import ./hello_world.yml
module: !import module/array.yml
url:    !import https://fake.url/old.json
raw:    !import-raw ./plain.html

### ./hello_world.yml
hello: world

### module/array.yml
- elem1
- elem2

### https://fake.url/old.json
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
  "local": {
   "hello": "world"
  },
  "module": [
    "elem1",
    "elem2"
  ],
  "url": {
    "jsonKey": "jsonValue"
  },
  "raw": "<!-- plain.html -->\n<div>Hey!</div>\n<p>\n  Some paragraph...\n</p>"
}
```

## Configuration

This loader is supposed to be used with [Webpack](https://webpack.js.org). The configuration snippet below is not a complete webpack configuration and only demonstrates how to configure this loader. Check the [documentation](https://webpack.js.org/configuration/) for information on how to configure webpack. The `parser` options are passed to the YAML parser: [js-yaml](https://github.com/nodeca/js-yaml). You can find more information about those options on their [README](https://github.com/nodeca/js-yaml/blob/master/README.md).

### Webpack - module.rules entry
```javascript
{
  test: /\.ya?ml$/,
  use: {
    loader: 'yaml-import-loader'
    
    // Note: The options below are the default options
    options: {

      // Allows !import <file> without key. When using this the
      // targets file content will be inserted at the import location.
      importRoot: false,

      // Allows !import <file> with key. Set this and importRoot to
      // false for a regular yaml-loader.
      importNested: true,

      // The import keyword: `!${importKeyword} <file>` for yaml/json
      // contents
      importKeyword: 'import',

      // The import-raw keyword: `!${importRawKeyword} <file>` for raw
      // file contents
      importRawKeyword: 'import-raw',

      // Output type. Can be 'object', 'json', or 'yaml'
      // 'object' -> exported js object
      // 'json'   -> stringified json
      // 'yaml'   -> stringified yaml
      output: 'object',

      // The options below are passed to js-yaml.
      parser: {

        // Allows adding custom types, details below.
        types: [],

        // Base schema to extend, can be an array of schemas.
        schema: require('js-yaml').SAFE_SCHEMA,

        // Allows a duplicate key. The old value in a duplicate key
        // will be overwritten (json option in js-yaml).
        allowDuplicate: true,

        // function to call on warning messages. Parser will throw on
        // warnings if this function is not provided.
        onWarning: undefined
      }
    }
  }
}
```

### Root imports

If you set the `importRoot` option to `true`, the yaml-import-loader will allow you to import files at the root level. This will insert the file contents at the import location.

```yaml
!import ./root-import1.yml
!import ./root-import2.yml

nested: !import ./nested-import.yml
```

> You must ensure that you do not mix types at the root level. If the file contains a mapping at the root level all root imports must import a mapping, if the root level is an array ever root import must import an array. If this is not the case parsing will fail.

### Custom types

This loader internally uses [js-yaml](https://github.com/nodeca/js-yaml) for parsing, check their [wiki](https://github.com/nodeca/js-yaml/wiki/Custom-types) for examples on using custom types. The types option accepts an array with `Type` objects, and functions returning a `Type` object. If you create your type in a function you will get context in the first parameter, with this context you can instruct the loader to resolve promises.

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
      return new Promise(resolve => {
        setTimeout(() => resolve(data.result), data.delay);
      });
    },
    instanceOf: String
  })
];
```

When passing the types array above to the loader we are allowed to use the `!async` type in our imported yaml files. Note that the delay here is for demonstration purposes, you can return the result directly instead of returning a `Promise`.

```yaml
# YAML input
result: !async
  delay: 1000
  result: 'I will be resolved after 1 second, asynchronously!'

# JSON output
{
  "result": "I will be resolved after 1 second, asynchronously!"
}
```

## Use cases

### Basic usage
```javascript
const yaml = require('./main.yml');

console.log(yaml.local.hello);
// world

console.log(JSON.stringify(yaml, undefined, 4));
// {
//   "local": {
//    "hello": "world"
//   },
//   "module": [
//     "elem1",
//     "elem2"
//   ],
//   "url": {
//     "jsonKey": "jsonValue"
//   },
//   "raw": "<!-- plain.html -->\n<div>Hey!</div>\n<p>\n  Some paragraph...\n</p>"
// }
```

### Examples
* [ngx-translate-yaml](https://github.com/ngfk/ngx-translate-yaml): Use ngx-translate, with yaml files, without runtime loading or parsing. 
