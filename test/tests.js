const config = {
  MAX_TRIES: 10,
  mutateGenes: {
    BIG_GENOME: 10,
    STD_DEV: 2,
    TWEAK_POINT: 0.5,
    SEVERE_POINT: 0.8,
    TWEAK_PROB: 0.5,
    SEVERE_PROB: 0.3
  },
}

// TEST RANDOM INT GENERATOR
function testRandInt() {
  const randInts1 = []
  for (let i = 0; i < 10; ++i)
    randInts1.push(MathUtils.randInt(10, 20))
  const tests = [randInts1.every( n => n === Math.floor(n) && 10 <= n && n < 20 )]

  const randInts2 = []
  for (let i = 0; i < 10; ++i)
    randInts2.push(MathUtils.randInt(-5, 5))
  tests.push(randInts2.every( n => n === Math.floor(n) && -5 <= n && n < 5 ))

  return testAllTrue(tests, 'RANDOM INT GENERATOR')
}
testRandInt()

// TEST BASIC GENOME FEED
let g0 = Genome.basic(2,1)
g0.links.forEach( link => link.weight = 1 )
g0.nodes[2].bias = 1
testNumArrayEquals(g0.feed([1, 1]), [1/(1 + Math.exp(3))], 'BASIC GENOME FEED')

// TEST ADD RANDOM NODE
function testAddRandNode() {
  const tests = [
    Mutators.addRandNode(g0, {node: g0.nodeCount, link: g0.linkCount}, config),
    g0.nodeCount == 4,
    g0.nodes.some( node => node.nType == NodeTypes.HIDDEN )
  ]

  const newNode = g0.nodes[3]
  tests.push(newNode.incomingLinks.length == 1)

  const oldNodeTo = g0.nodes[2]
  tests.push(oldNodeTo.incomingLinks.length == 3)

  const oldLinkId = oldNodeTo.incomingLinks.find( linkId => !g0.links[linkId].isEnabled )
  tests.push(g0.links[oldLinkId].from == g0.links[newNode.incomingLinks[0]].from)
  
  return testAllTrue(tests, 'ADD RANDOM NODE')
}
testAddRandNode()

// TEST CLONE GENOME
function testCloneGenome() {
  const g0 = Genome.basic(1,1)
  const g1 = g0.clone()
  Mutators.addRandNode(g1, {node: 2, link:1}, config)

  const tests = [
    g0.nodeCount == 2 && g0.linkCount == 1,
    g1.nodeCount == 3 && g1.linkCount == 3,
    g0.nodes[1].incomingLinks.length == 1,
    g1.nodes[1].incomingLinks.length == 2,
    g0.links[0].isEnabled,
    !g1.links[0].isEnabled
  ]
  
  return testAllTrue(tests, 'CLONE GENOME')
}
testCloneGenome()

// TEST COMPARE LINKS
function testCompareLinks() {
  const g1 = { linkCount: 6, linkIds: [1,2,5,6,8,9] }
  const g2 = { linkCount: 5, linkIds: [1,3,4,8,10] }
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
}
testCompareLinks()