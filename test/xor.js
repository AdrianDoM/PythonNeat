"use strict"

const config = new Config({
  INPUT_NUM: 2,
  OUTPUT_NUM: 1,
  POP_SIZE: 100,
  mutators: {
    BIG_GENOME: 1
  },
  fitnessFunc: g => {
    const sumSqDist = (g.feed([0,0]) - 0)**2 + (g.feed([0,1]) - 1)**2 +
      (g.feed([1,0]) - 1)**2 + (g.feed([1,1]) - 0)**2
    return Math.exp(-sumSqDist)
  }
})

const pop = Population.initPopulation(config)
console.log(pop)
pop.advance(50, true)
