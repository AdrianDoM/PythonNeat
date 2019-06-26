const MAX_TRIES = 10

class Genome {

  // Empty Genome
  constructor() {
    this.nodeOrder = [] // Node ids ordered for activation
    this.nodes     = [] // Nodes indexed by their id
    this.linkIds   = [] // Link ids
    this.links     = [] // Links indexed by their id
    
    this.nodeCount = 0  // Mostly for tracking purposes
    this.inputNum  = 0
    this.outputNum = 0
    this.linkCount = 0
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

    for (let i = 0; i < inputNum; ++i) {
      gen.nodes.push(new Node(NodeTypes.INPUT, gen.nodeCount))
      gen.nodeOrder.push(gen.nodeCount++)
    }
    gen.inputNum = inputNum

    for (let i = 0; i < outputNum; ++i) {
      gen.nodes.push(new Node(NodeTypes.OUTPUT, gen.nodeCount))
      gen.nodeOrder.push(gen.nodeCount++)
    }
    gen.outputNum = outputNum

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

  // Adds a random forward Link to this Genome
  // Returns whether the Link could be added
  addRandForwardLink(availableIds) {
    let tries = 0
    let found = false
    let fromOrderIndex, from, toOrderIndex, to

    while (!found && tries++ < MAX_TRIES) {
      // Select random 'from' Node among inputs and hidden
      fromOrderIndex = Math.randInt(0, this.nodeCount - this.outputNum)
      from = this.nodeOrder[fromOrderIndex]
      fromOrderIndex = (fromOrderIndex < this.inputNum) ? this.inputNum : fromOrderIndex + 1

      // Select random 'to' Node among hidden and outputs
      toOrderIndex = Math.randInt(fromOrderIndex, this.nodeCount)
      to = this.nodeOrder[toOrderIndex]

      // Check if such a Link already exists
      found = !this.links.some( link => link.from == from && link.to == to )
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, add it to the Genome
    this.addLink(availableIds.link++, from, to)

    return true
  }

  // Adds a random recurrent Link to this Genome
  // Returns whether the Link could be added
  addRandRecurrentLink(availableIds) {
    let tries = 0
    let found = false
    let fromOrderIndex, from, toOrderIndex, to

    while (!found && tries++ < MAX_TRIES) {
      // Select random 'from' Node among hidden and outputs
      fromOrderIndex = Math.randInt(this.inputNum + 1, this.nodeCount)
      from = this.nodeOrder[fromOrderIndex]
      if (fromOrderIndex >= this.nodeCount - this.outputNum)
        fromOrderIndex = this.nodeCount - this.outputNum

      // Select random 'to' Node among hidden
      toIndex = Math.randInt(this.inputNum, fromOrderIndex)
      to = this.nodeOrder[toOrderIndex]

      // Check if such a Link already exists
      found = !this.links.some( link => link.from == from && link.to == to )
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, add it to the Genome
    this.addLink(availableIds.link++, from, to, true)

    return true
  }

  // Adds a random Node to this Genome
  // Returns whether the Node could be added
  // As explained in the NEAT paper, this is done by splitting an existing
  // enabled Link (must be forward in our case) into two new Links with the
  // new Node in between
  addRandNode(availableIds) {
    let tries = 0
    let found = false
    let oldLinkId, oldLink

    while (!found && tries++ < MAX_TRIES) {
      // Select a random Link
      oldLinkId = this.linkIds[Math.randInt(0, this.linkIds.length)]
      oldLink = this.links[oldLinkId]

      // Check if oldLink is enabled and not recurrent
      found = oldLink.isEnabled && !oldLink.isRecurrent
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, disable it and create the new Links and Node
    oldLink.isEnabled = false

    const from = oldLink.from
    const to   = oldLink.to

    // The new Node will be positioned as close as possible to oldLink.to
    // in the Genome list
    let orderIndex = (this.nodes[to].nType == NodeTypes.OUTPUT) ? this.nodeCount - this.outputNum
      : this.nodeOrder.indexOf(to)
    this.addNode(NodeTypes.HIDDEN, availableIds.node, orderIndex)

    // The new weights of the Links are specified in the NEAT paper
    this.addLink(availableIds.link++, from, availableIds.node, false, true, 1)
    this.addLink(availableIds.link++, availableIds.node, to, false, true, oldLink.weight)

    ++availableIds.node

    return true
  }

}