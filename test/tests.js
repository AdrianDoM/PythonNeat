
// TEST RANDOM INT GENERATOR
function testRandInt() {
  const randInts1 = []
  for (let i = 0; i < 10; ++i)
    randInts1.push(Math.randInt(10, 20))
  const tests = [randInts1.every( n => n === Math.floor(n) && 10 <= n && n < 20 )]

  const randInts2 = []
  for (let i = 0; i < 10; ++i)
    randInts2.push(Math.randInt(-5, 5))
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
    g0.addRandNode({node: g0.nodeCount, link: g0.linkCount}),
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
  g1.addRandNode({node: 2, link:1})

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