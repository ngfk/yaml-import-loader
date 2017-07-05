
[![npm version](https://img.shields.io/npm/v/yaml-import-loader.svg)](https://www.npmjs.com/package/yaml-import-loader)
[![Build Status](https://travis-ci.org/ngfk/yaml-import-loader.svg?branch=master)](https://travis-ci.org/ngfk/yaml-import-loader)

```yaml
# main.yml

!import ./file1.yml

hello: world!
external_map: !import ./file2.yml
external_arr: !import ./file3.yml
```

```yaml
# file1.yml

file1: root import
```

```yaml
# file2.yml

file2: map
key: value
```

```yaml
# file3.yml

- file3
- array
```

```javascript
var file = require("yaml-import-loader!./main.yml");

console.log(file);
// file1: root import
// hello: world!
// external_map:
//   file2: map
//   key: value
// external_arr:
//   - file3
//   - array
```
