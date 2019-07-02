"use strict"
// Gaussian random variable generator following the Marsaglia polar
// method as outlined in "https://en.wikipedia.org/wiki/Marsaglia_polar_method"
function gaussClosure() {
  let spare
  let isSpareReady = false

  function gauss(mean, stdDev) {
    if (isSpareReady) {
      isSpareReady = false
      return spare * stdDev + mean
    } else {
      let u, v, s;
      do {
        u = Math.random() * 2 - 1
        v = Math.random() * 2 - 1
        s = u * u + v * v
      } while (s >= 1 || s == 0)

      let mul = Math.sqrt(-2.0 * Math.log(s) / s)
      spare = v * mul
      isSpareReady = true
      return mean + stdDev * u * mul
    }
  }

  return gauss
}

const MathUtils = {

  rand: function(...args) {
    let min, max
    if (args.length == 1) {
      min = 0
      max = args[0]
    } else {
      min = args[0]
      max = args[1]
    }

    return min + Math.random() * (max - min)
  },

  randInt: function(...args) {
    let min, max
    if (args.length == 0) {
      min = 0
      max = 1
    } else if (args.length == 1) {
      min = 0
      max = args[0]
    } else {
      min = args[0]
      max = args[1]
    }

    return min + Math.floor(Math.random() * (max - min))
  },

  gauss: gaussClosure()
  
}