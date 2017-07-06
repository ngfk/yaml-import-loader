
# yaml-import-loader

Webpack loader for yaml files supporting the `!import` type to combine different yaml files.

[![npm version](https://img.shields.io/npm/v/yaml-import-loader.svg)](https://www.npmjs.com/package/yaml-import-loader)
[![Downloads](https://img.shields.io/npm/dt/yaml-import-loader.svg)](https://www.npmjs.com/package/yaml-import-loader)
[![Build Status](https://travis-ci.org/ngfk/yaml-import-loader.svg?branch=master)](https://travis-ci.org/ngfk/yaml-import-loader)

## Installation
```
npm install --save-dev yaml-import-loader
```

## Usage

### YAML input
```yaml
# main.yml
key1: !import ./hello_world.yml
key2: !import ./array.yml
```

```yaml
# hello_world.yml
hello: world
```

```yaml
# array.yml
- elem1
- elem2
```

### JSON output
```json
{
  "key1": {
   "hello": "world"
  },
  "key2": [
    "elem1",
    "elem2"
  ]
}
```

## Examples

### Runtime YAML loading
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
            // Allows !import <file> without key. When using this the targets
            // content will simply be inserted at the import location.
            importRoot: false,

            // Allows !import <file> with key. Settings this and importRoot
            // to false will create a regular yaml-loader.
            importNested: true,

            // The import keyword !${keyword} <file>
            importKeyword: 'import',

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
```javascript
let yaml = require('./main.yml');

console.log(yaml.key1.hello);
// world

console.log(JSON.stringify(yaml, undefined, 4));
// {
//   "key1": {
//     "hello": "world"
//   },
//   "key2": [
//     "elem1",
//     "elem2"
//   ]
// }
```

### Projects

* [ngx-translate-yaml](https://github.com/ngfk/ngx-translate-yaml)
