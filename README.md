# yaml-import-loader

YAML loader for [Webpack](https://webpack.js.org) supporting the `!import <file>` type to include different YAML files.

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
  }
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

            // The import keyword: `!${importKeyword} <file>`
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
//   }
// }
```

### Examples
* Use ngx-translate, with yaml files, without a runtime loader.  
[ngx-translate-yaml](https://github.com/ngfk/ngx-translate-yaml)
