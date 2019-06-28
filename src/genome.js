class Genome {

  // Empty Genome
  constructor() {
    this.nodeOrder = [] // Node ids ordered for activation
    this.nodes     = [] // Nodes indexed by their id
    this.linkIds   = [] // Link ids
    this.links     = [] // Links indexed by their id
    
    this.nodeCount = 0  // Mostly for tracking purpzoses
    this.linkCount = 0
    this.inputNum  = 0
    this.outputNum = 0
  }

  // Add the specified Link to this Genome
  // Takes care of setting connections to end Nodes
  addLink(linkId, from, to, isRecurrent, isEnabled, weight) {
    const newLink = new Link(linkId, from, to, isRecurrent, weight)
    this.links[linkId] = newLink
    this.linkIds.push(linkId)
    ++this.linkCount

    this.nodes[to].incomingLinks.push(linkId)
  }

  // Add the specified Node to this Genome
  addNode(nodeType, nodeId, orderIndex, incomingLinks, bias) {
    const newNode = new Node(nodeType, nodeId, incomingLinks, bias)
    this.nodes[nodeId] = newNode
    this.nodeOrder.splice(orderIndex, 0, nodeId)
    ++this.nodeCount
  }
  
  // Returns a new Genome with consists of the given number of input
  // and output nodes fully connected with no hidden nodes
  static basic(inputNum, outputNum) {
    const gen = new Genome()

    gen.inputNum = inputNum
    for (let i = 0; i < inputNum; ++i)
      gen.addNode(NodeTypes.INPUT, gen.nodeCount, gen.nodeCount)

    gen.outputNum = outputNum
    for (let i = 0; i < outputNum; ++i)
      gen.addNode(NodeTypes.OUTPUT, gen.nodeCount, gen.nodeCount)

    for (let i = 0; i < inputNum; ++i)
      for (let o = inputNum; o < gen.nodeCount; ++o) {
        gen.addLink(gen.linkCount, i, o)
      }

    return gen
  }

  // Returns a deep copy of this Genome
  clone() {
    const newGenome = new Genome()

    newGenome.nodeCount = this.nodeCount
    newGenome.inputNum  = this.inputNum
    newGenome.outputNum = this.outputNum
    newGenome.linkCount = this.linkCount

    // Shallow copy value arrays
    newGenome.nodeOrder = this.nodeOrder.slice(0)
    newGenome.linkIds   = this.linkIds.slice(0)

    // Deep copy object arrays
    newGenome.nodes = this.nodes.map( node => node.clone() )
    newGenome.links = this.links.map( link => link.clone() )

    return newGenome
  }

  // Activate a single node given its id and return the activation
  activateNode(nodeId) {
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
    return node.activation = 1 / (1 + Math.exp(sum))
  }

  // Feed the given inputValues to the Neural Network, which is the
  // phenotype of this Genome (genotype and phenotype are kept together
  // for simplicity), and return its output
  feed(inputValues) {
    for (let i = 0; i < this.inputNum; ++i) // for all inputs
      this.nodes[i].activation = inputValues[i]

    for (let h = this.inputNum; h < this.nodeCount - this.outputNum; ++h)
      this.activateNode(this.nodeOrder[h]) // activate hidden in order

    const outputValues = []
    for (let o = this.inputNum; o < this.inputNum + this.outputNum; ++o) // for all outputs
      outputValues.push(this.activateNode(o))

    return outputValues
  }

}