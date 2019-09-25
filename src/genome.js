"use strict"
class Genome {

  // Empty Genome
  constructor() {
    this.nodeOrder = [] // Node ids ordered for activation
    this.nodes     = [] // Nodes indexed by their id
    this.linkIds   = [] // Link ids (naturally ordered)
    this.links     = [] // Links indexed by their id
    
    this.inputNum  = 0
    this.outputNum = 0

    this.fitness       = 0 // Individual fitness for this Genome
    this.sharedFitness = 0 // Fitness scaled within the species
  }

  // Add the specified Link to this Genome
  // Takes care of setting connections to end Nodes
  addLink(linkId, from, to, isRecurrent, isEnabled, weight) {
    const newLink = new Link(linkId, from, to, isRecurrent, isEnabled, weight)
    this.links[linkId] = newLink
    this.linkIds.push(linkId)

    this.nodes[to].incomingLinks.push(linkId)
  }

  // Add the specified Node to this Genome
  addNode(nodeType, nodeId, orderIndex, incomingLinks, bias) {
    const newNode = new Node(nodeType, nodeId, incomingLinks, bias)
    this.nodes[nodeId] = newNode
    this.nodeOrder.splice(orderIndex, 0, nodeId)
  }
  
  // Returns a new Genome with consists of the given number of input
  // and output nodes fully connected with no hidden nodes
  static basic(inputNum, outputNum) {
    const gen = new Genome()

    gen.inputNum = inputNum
    for (let i = 0; i < inputNum; ++i)
      gen.addNode(NodeTypes.INPUT, gen.nodeOrder.length, gen.nodeOrder.length)

    gen.outputNum = outputNum
    for (let i = 0; i < outputNum; ++i)
      gen.addNode(NodeTypes.OUTPUT, gen.nodeOrder.length, gen.nodeOrder.length)

    for (let i = 0; i < inputNum; ++i)
      for (let o = inputNum; o < gen.nodeOrder.length; ++o) {
        gen.addLink(gen.linkIds.length, i, o)
      }

    return gen
  }

  // Returns a deep copy of this Genome
  clone() {
    const newGenome = new Genome()

    newGenome.inputNum  = this.inputNum
    newGenome.outputNum = this.outputNum

    // Shallow copy value arrays
    newGenome.nodeOrder = this.nodeOrder.slice(0)
    newGenome.linkIds   = this.linkIds.slice(0)

    // Deep copy object arrays
    newGenome.nodes = this.nodes.map( node => node.clone() )
    newGenome.links = this.links.map( link => link.clone() )

    return newGenome
  }

  // Activate a single node given its id and return the activation
  activateNode(nodeId, coeff) {
    const node = this.nodes[nodeId]
    // In this sum, nothing special is done for recurrent Links.
    // These will always come from nodes that are activated later
    // in the process, so their activation is simply their previous
    // one, as needed for recurrent connections.
    let sum = 0
    for (const linkId of node.incomingLinks) {
      const link = this.links[linkId]
      sum += link.weight * this.nodes[link.from].activation
    }
    sum += node.bias

    // Inline sigmoid activation function
    return node.activation = 1 / (1 + Math.exp(-coeff * sum))
  }

  // Feed the given inputValues to the Neural Network, which is the
  // phenotype of this Genome (genotype and phenotype are kept together
  // for simplicity), and return its output
  feed(inputValues, coeff=4.9) {
    for (let i = 0; i < this.inputNum; ++i) // for all inputs
      this.nodes[i].activation = inputValues[i]

    for (let h = this.inputNum; h < this.nodeOrder.length - this.outputNum; ++h)
      this.activateNode(this.nodeOrder[h], coeff) // activate hidden in order

    const outputValues = []
    for (let o = this.inputNum; o < this.inputNum + this.outputNum; ++o) // for all outputs
      outputValues.push(this.activateNode(o, coeff))

    return outputValues
  }

  // Returns an object containing five arrays: 'matching', 'disjoint1' and 
  // 'disjoint2' and 'excess1' and 'excess2', which specify the Link ids that
  // fall withing each class as described by the NEAT paper. 'disjoint1' contains
  // those ids contained in genome1 whereas 'disjoint2' contains those in genome2;
  // 'excess1' and 'excess2' are analogous
  static compareLinks(genome1, genome2) {
    const res = {
      matching: [],
      disjoint1: [],
      disjoint2: [],
      excess1: [],
      excess2: []
    }

    // We take advantage of the fact that the linkIds list is sorted for both genomes
    let i = 0, j = 0
    while (i < genome1.linkIds.length && j < genome2.linkIds.length) {

      // Add id to matching if both match
      if (genome1.linkIds[i] == genome2.linkIds[j]) {
        res.matching.push(genome1.linkIds[i])
        ++i
        ++j
      }

      // If one of the ids is smaller, the other genome missed it
      else if (genome1.linkIds[i] < genome2.linkIds[j])
        res.disjoint1.push(genome1.linkIds[i++])
      else // if (genome1.linkIds[i] > genome2.linkIds[j])
        res.disjoint2.push(genome2.linkIds[j++])

    }
    
    // At this point one of the two genomes has been exhausted, we add the rest
    // of the Link ids in the other one to its excess list
    while (i < genome1.linkIds.length)
      res.excess1.push(genome1.linkIds[i++])
    while (j < genome2.linkIds.length)
      res.excess2.push(genome2.linkIds[j++])

    return res
  }

}