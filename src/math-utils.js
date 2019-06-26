Math.rand = function(...args) {
  let min, max
  if (args.length == 1) {
    min = 0
    max = args[0]
  } else {
    min = args[0]
    max = args[1]
  }

  return min + Math.random() * (max - min)
}

Math.randInt = function(...args) {
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
}