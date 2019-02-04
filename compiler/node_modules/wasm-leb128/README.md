# wasm-LEB128
LEB128 utilities for WebAssembly

```npm i wasm-leb128 --save```

## Included functions
all function return a new `Uint8ClampedArray`
```javascript
import { varint7 } from 'wasm-leb128'  // variable length 7 bit signed int
import { varint32 } from 'wasm-leb128' // variable length 32 bit signed int
import { varint64 } from 'wasm-leb128' // variable length 64 bit signed int

import { varuint1 } from 'wasm-leb128'  // variable length 1 bit unsigned int
import { varuint7 } from 'wasm-leb128'  // variable length 7 bit unsigned int
import { varuiny32 } from 'wasm-leb128' // variable length 32 bit unsigned int
import { varuint64 } from 'wasm-leb128' // variable length 64 bit unsigned int

import { LEB128_s } from 'wasm-leb128'  // signed LEB128 algorithm
import { LEB128_u } from 'wasm-leb128'  // unsigned LEB128 algorithm
```
