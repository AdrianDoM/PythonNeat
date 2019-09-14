"use strict"
const config = new Config({
  SIGMOID_COEFF: 1
})

// TEST RANDOM INT GENERATOR
;(function () {
  const randInts1 = []
  for (let i = 0; i < 10; ++i)
    randInts1.push(MathUtils.randInt(10, 20))
  const tests = [randInts1.every( n => n === Math.floor(n) && 10 <= n && n < 20 )]

  const randInts2 = []
  for (let i = 0; i < 10; ++i)
    randInts2.push(MathUtils.randInt(-5, 5))
  tests.push(randInts2.every( n => n === Math.floor(n) && -5 <= n && n < 5 ))

  return testAllTrue(tests, 'RANDOM INT GENERATOR')
})()

// TEST BASIC GENOME FEED
let g0 = Genome.basic(2,1)
g0.links.forEach( link => link.weight = 1 )
g0.nodes[2].bias = 1
testNumArrayEquals(g0.feed([1, 1], config), [1/(1 + Math.exp(-3))], 'BASIC GENOME FEED')

// TEST ADD RANDOM NODE
;(function () {
  const tests = [
    Mutators.addRandNode(g0, {node: g0.nodeOrder.length, link: g0.linkIds.length}, { node: [], link: [] }, config),
    g0.nodeOrder.length == 4,
    g0.nodes.some( node => node.nType == NodeTypes.HIDDEN )
  ]

  const newNode = g0.nodes[3]
  tests.push(newNode.incomingLinks.length == 1)

  const oldNodeTo = g0.nodes[2]
  tests.push(oldNodeTo.incomingLinks.length == 3)

  const oldLinkId = oldNodeTo.incomingLinks.find( linkId => !g0.links[linkId].isEnabled )
  tests.push(g0.links[oldLinkId].from == g0.links[newNode.incomingLinks[0]].from)
  
  return testAllTrue(tests, 'ADD RANDOM NODE')
})()

// TEST CLONE GENOME
;(function () {
  const g0 = Genome.basic(1,1)
  const g1 = g0.clone()
  Mutators.addRandNode(g1, {node: 2, link:1}, { node: [], link: [] }, config)

  const tests = [
    g0.nodeOrder.length == 2 && g0.linkIds.length == 1,
    g1.nodeOrder.length == 3 && g1.linkIds.length == 3,
    g0.nodes[1].incomingLinks.length == 1,
    g1.nodes[1].incomingLinks.length == 2,
    g0.links[0].isEnabled,
    !g1.links[0].isEnabled
  ]
  
  return testAllTrue(tests, 'CLONE GENOME')
})()

// TEST COMPARE LINKS
;(function () {
  const g1 = { linkIds: [1,2,5,6,8,9] }
  const g2 = { linkIds: [1,3,4,8,10] }
  const res = Genome.compareLinks(g1, g2)

  const tests = [
    res.matching.length == 2,
    [1,8].every( (n, i) => n == res.matching[i]  ),
    res.disjoint1.length == 4,
    [2,5,6,9].every( (n, i) => n == res.disjoint1[i] ),
    res.disjoint2.length == 2,
    [3,4].every( (n, i) => n == res.disjoint2[i] ),
    res.excess1.length == 0,
    res.excess2.length == 1,
    res.excess2[0] == 10
  ]
  
  return testAllTrue(tests, 'COMPARE LINKS')
})()

// TEST MATE
;(function () {
  const g1 = Genome.basic(2,1)
  const g2 = Genome.basic(2,1)

  Mutators.addRandNode(g1, { node: 3, link: 2 }, { node: [], link: [] }, config)

  g2.linkIds.forEach( linkId => g2.links[linkId].weight = 100 )

  g1.fitness = 1
  g2.fitness = 0

  const baby = Mutators.mate(g1, g2)

  const tests = [
    baby.nodeOrder.length == 4,
    baby.linkIds.length == 4
    // The last check depends on chance, it should fail half the time
    // baby.linkIds.some( linkId => baby.links[linkId].weight == 100 )
  ]

  return testAllTrue(tests, 'MATE')
})()

// TEST SPECIES FITNESS
;(function () {
  const g1 = Genome.basic(1,1)
  const g2 = Genome.basic(3,3)

  const species = Species.fromGenome(g1)
  species.genomes.push(g2)

  species.computeFitness({ fitnessFunc: genome => genome.linkIds.length })

  const tests = [
    species.genomes[0] == g2,
    species.genomes[1] == g1,
    g2.fitness == 3 * 3 / 2,
    g1.fitness == 1 / 2
  ]

  return testAllTrue(tests, 'SPECIES FITNESS')
})()

// TEST INIT POPULATION
;(function () {
  const config = new Config({
    INPUT_NUM: 3,
    OUTPUT_NUM: 2,
    POP_SIZE: 10,
    species: {
      WEIGHTS_COEFF: 3
    }
  })

  const p = Population.initPopulation(config)

  const tests = [
    p.species.length > 1, // Probably true
    p.species.map( s => s.genomes.length ).reduce( (a,b) => a + b, 0) == 10
  ]

  return testAllTrue(tests)
})()

// TEST FITNESS (POPULATION WIDE)
;(function () {
  const config = new Config({
    INPUT_NUM: 3,
    OUTPUT_NUM: 2,
    POP_SIZE: 10,
    species: {
      WEIGHTS_COEFF: 3
    }
  })
})()

console.log(`Passed ${success_count}/${test_count} tests`)