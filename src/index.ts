import * as pull from 'pull-stream'

export default function <T>(hwm = 10, lwm = 0, group = false) {
  type cbType = (end: pull.EndOrError, data?: T | T[]) => void

  let _reading = false
  let _ended: pull.EndOrError = false
  let buffer: T[] = []
  let _cb: cbType | null = null

  return function (rawRead: pull.Source<T>) {
    function more() {
      if (_reading || _ended || buffer.length >= hwm) return
      _reading = true

      rawRead(null, function (end, data?: T) {
        if (end) {
          _ended = end
        } else {
          buffer.push(data!)
        }

        _reading = false
        more()

        maybe(_cb)
      })
    }

    function maybe(cb: cbType | null) {
      // <delay> callback, if the buffer is smaller than <size>
      if (!cb) return
      if (!_ended && buffer.length < lwm) {
        _cb = cb
        return
      }

      _cb = null
      if (_ended && _ended !== true) {
        cb(_ended)
      } else if (buffer.length) {
        if (group) {
          const items = buffer
          buffer = []
          cb(null, items)
        } else {
          cb(null, buffer.shift())
        }
      } else if (_ended) {
        cb(_ended)
      } else _cb = cb
    }

    more()

    return function (abort: pull.Abort, cb: pull.SourceCallback<T | T[]>) {
      if (abort) {
        rawRead(abort, cb)
      } else {
        maybe(cb)
      }

      more()
    }
  }
}
