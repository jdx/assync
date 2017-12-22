[![view on npm](http://img.shields.io/npm/v/assync.svg)](https://www.npmjs.org/package/assync)
[![npm module downloads](http://img.shields.io/npm/dt/assync.svg)](https://www.npmjs.org/package/assync)
[![CircleCI](https://circleci.com/gh/jdxcode/assync.svg?style=svg)](https://circleci.com/gh/jdxcode/assync)
[![Dependency Status](https://david-dm.org/jdxcode/assync.svg)](https://david-dm.org/jdxcode/assync)
[![codecov](https://codecov.io/gh/jdxcode/assync/branch/master/graph/badge.svg)](https://codecov.io/gh/jdxcode/assync)

**Example**
```js
const {assync} = require('assync')

async function main () {
    const output = await assync([1, null, 3]).filter(i => i !== null)
      console.dir(output)
}
main()
```
