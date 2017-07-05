
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

todo: import me
```

```yaml
# file2.yml

key: value
```

```yaml
# file3.yml

- a
- b
- c
```

```javascript
var file = require("json-loader!yaml-loader!yaml-import-loader!./main.yml");

console.log(JSON.stringify(file, undefined, 4));
// {
//     "hello": "world!",
//     "external_map": {
//         "key": "value"
//     },
//     "external_arr": [
//         "a",
//         "b",
//         "c"
//     ]
// }
```
