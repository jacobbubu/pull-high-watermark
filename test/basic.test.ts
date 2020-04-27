import * as pull from 'pull-stream'
import HighWaterMark from '../src'
import { Source as Spec } from '@jacobbubu/pull-spec'

function source(i = 3) {
  return function read(abort: pull.Abort, cb: pull.SourceCallback<any>) {
    if (abort) return cb(abort)
    setTimeout(() => {
      i = i - 1

      if (i === 0) {
        return cb(new Error('bork'))
      }
      if (i < 0) {
        return cb(true)
      }
      cb(null, i)
    }, Math.random() * 30)
  }
}

function syncSource(i = 3) {
  return function read(abort: pull.Abort, cb: pull.SourceCallback<any>) {
    if (abort) return cb(abort)
    i = i - 1
    if (i === 0) {
      return cb(new Error('bork'))
    }
    if (i < 0) {
      return cb(true)
    }
    cb(null, i)
  }
}
describe('basic', () => {
  it('async then error', (done) => {
    pull(
      Spec(source()),
      HighWaterMark(),
      pull.collect(function (err, ary) {
        expect(err).toBeTruthy()
        expect(ary.length).toBeLessThanOrEqual(2)
        done()
      })
    )
  })

  it('sync then error', (done) => {
    pull(
      Spec(syncSource()),
      HighWaterMark(),
      pull.collect(function (err, ary) {
        expect(err).toBeTruthy()
        expect(ary).toEqual([])
        done()
      })
    )
  })

  it('sync then end', (done) => {
    pull(
      Spec(pull.values([3, 2, 1])),
      HighWaterMark(),
      pull.collect(function (err, ary) {
        expect(err).toBeFalsy()
        expect(ary).toEqual([3, 2, 1])
        done()
      })
    )
  })

  it('async then end', (done) => {
    pull(
      Spec(
        pull(
          pull.values([3, 2, 1]),
          pull.asyncMap(function (d, cb) {
            setTimeout(function () {
              cb(null, d)
            }, 0)
          })
        )
      ),
      HighWaterMark(),
      pull.collect(function (err, ary) {
        expect(err).toBeFalsy()
        expect(ary).toEqual([3, 2, 1])
        done()
      })
    )
  })

  it('sync group then end', (done) => {
    pull(
      Spec(pull.values([3, 2, 1])),
      HighWaterMark(2, 1, true),
      pull.collect(function (err, ary) {
        expect(err).toBeFalsy()
        expect(ary).toEqual([[3, 2], [1]])
        done()
      })
    )
  })

  it('async group then end', (done) => {
    pull(
      Spec(
        pull(
          pull.values([3, 2, 1]),
          pull.asyncMap(function (d, cb) {
            setTimeout(function () {
              cb(null, d)
            }, 0)
          })
        )
      ),
      HighWaterMark(2, 1, true),
      pull.collect(function (err, ary) {
        expect(err).toBeFalsy()
        expect(ary).toEqual([[3], [2], [1]])
        done()
      })
    )
  })

  it('async group slow consume then end', (done) => {
    pull(
      Spec(
        pull(
          pull.values([3, 2, 1, 0]),
          pull.asyncMap(function (d, cb) {
            setTimeout(function () {
              cb(null, d)
            }, 0)
          })
        )
      ),
      HighWaterMark(2, 1, true),
      pull.asyncMap(function (d, cb) {
        setTimeout(function () {
          cb(null, d)
        }, 10)
      }),
      pull.collect(function (err, ary) {
        expect(err).toBeFalsy()
        expect(ary).toEqual([[3], [2, 1], [0]])
        done()
      })
    )
  })

  it('segmented sync group slow consume then end', (done) => {
    pull(
      Spec(
        pull(
          pull.values([3, 2, 1, 0]),
          pull.asyncMap(function (d, cb) {
            if (d === 1) {
              setTimeout(function () {
                cb(null, d)
              }, 0)
            } else {
              cb(null, d)
            }
          })
        )
      ),
      HighWaterMark(2, 1, true),
      pull.asyncMap(function (d, cb) {
        setTimeout(function () {
          cb(null, d)
        }, 10)
      }),
      pull.collect(function (err, ary) {
        expect(err).toBeFalsy()
        expect(ary).toEqual([
          [3, 2],
          [1, 0],
        ])
        done()
      })
    )
  })
})
