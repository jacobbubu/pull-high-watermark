# @jacobbubu/pull-high-watermark

[![Build Status](https://github.com/jacobbubu/pull-high-watermark/workflows/Build%20and%20Release/badge.svg)](https://github.com/jacobbubu/pull-high-watermark/actions?query=workflow%3A%22Build+and+Release%22)
[![Coverage Status](https://coveralls.io/repos/github/jacobbubu/pull-high-watermark/badge.svg)](https://coveralls.io/github/jacobbubu/pull-high-watermark)
[![npm](https://img.shields.io/npm/v/@jacobbubu/pull-high-watermark.svg)](https://www.npmjs.com/package/@jacobbubu/pull-high-watermark/)

> Rewritten [pull-high-watermark](https://github.com/pull-stream/pull-high-watermark) in TypeScript.

# pull-high-watermark

a pull stream that eagerly reads ahead until it has reached the watermark.

# example

if there is medium/heavy sync processing in the pipe line (say, parsing),
it may go faster if we ensure there is always something coming in the async part,

We never want the io to be waiting for the parsing.

``` js
import { pull } from ('pull-stream')
import HighWatermark from '@jacobbubu/pull-high-watermark'

pull(
  asyncSource,
  HighWatermark(10, 2), //go faster!
  heavySyncProcessing(),
  sink
)
```

## HighWatermark(hwm, lwm[, group]) => through

read ahead at most to the high water mark (`hwm`) and at least to the low water mark (`lwm`)
`hwm` default to 10, and `lwm` defaults to 0.

the `group` option indicates that the buffer should be emitted wholesale as an
array. this allows consumers to run batch operations on values, while avoiding
slowing down the upstream producer. defaults to `false`.

## License

MIT
