const MAX_TRIES = 10

const NodeTypes = {
  INPUT:  0,
  HIDDEN: 1,
  OUTPUT: 2
}

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

class Node {

  constructor(nodeType, nodeId, incomingLinks, bias) {
    this.nType = nodeType
    this.id    = nodeId
    if (nodeType != NodeTypes.INPUT) {
      this.incomingLinks = (incomingLinks == undefined) ? [] : incomingLinks
      this.bias = (bias == undefined) ? Math.rand(-1, 1) : bias
    }
  }

  // Sets and returns the activation of this node
  activate() {
    // In this sum, nothing special is done for recurrent Links.
    // These will always come from nodes that are activated later
    // in the process, so their activation is simply their previous
    // one, as needed for recurrent connections.
    let sum = 0
    for (const link of this.incomingLinks)
      if (link.from.activation != undefined)
        sum += link.from.activation * link.weight
    sum += this.bias

    // Inline sigmoid activation function
    return this.activation = 1 / (1 + Math.exp(sum))
  }

}

class Link {

  constructor(nodeFrom, nodeTo, isRecurrent, weight) {
    this.from = nodeFrom
    this.to   = nodeTo
    // isRecurrent is stored mostly for labelling purposes.
    // Recursive Links are handled naturally by the implementation
    // The only special behaviour is that recurrent Links cannot be
    // split when adding a new node.
    this.isRecurrent = (isRecurrent == undefined) ? false : isRecurrent
    this.weight = (weight == undefined) ? Math.rand(-1, 1) : weight
    this.isEnabled = true

    // Update the 'to' Node to include this link
    nodeTo.incomingLinks.push(this)
  }

}

class Genome {

  // Empty Genome
  constructor() {
    this.nodeCount = 0 // Mostly for tracking purposes
    this.inputs = []
    this.outputs = []
    this.hidden = []
    this.links = []
  }

  // Returns a new Genome with consists of the given number of input
  // and output nodes fully connected with no hidden nodes
  static basic(inputNum, outputNum) {
    const gen = new Genome()

    for (let i = 0; i < inputNum; ++i)
      gen.inputs.push(new Node(NodeTypes.INPUT, gen.nodeCount++))

    for (let i = 0; i < outputNum; ++i)
      gen.outputs.push(new Node(NodeTypes.OUTPUT, gen.nodeCount++))

    for (const o of gen.outputs)
      for (const i of gen.inputs) {
        const link = new Link(i, o)
        gen.links.push(link)
      }

    return gen
  }

  // Feed the given inputValues to the Neural Network, which is the
  // phenotype of this Genome (genotype and phenotype are kept together
  // for simplicity), and return its output
  feed(inputValues) {
    this.inputs.forEach( (input, i) => input.activation = inputValues[i] )
    this.hidden.forEach( hidden => hidden.activate() )
    return this.outputs.map( output => output.activate() )
  }

  // Adds a random forward Link to this Genome
  // Returns whether the Link could be added
  addRandForwardLink() {
    let tries = 0
    let found = false
    let fromIndex, from, toIndex, to

    while (!found && tries++ < MAX_TRIES) {
      // Select random 'from' Node among inputs and hidden
      fromIndex = Math.randInt(0, this.inputs.length + this.hidden.length)
      if (fromIndex < this.inputs.length) {
        from = this.inputs[fromIndex]
        fromIndex = 0
      } else {
        fromIndex -= this.inputs.length
        from = this.hidden[fromIndex++]
      }

      // Select random 'to' Node among hidden and outputs
      toIndex = Math.randInt(fromIndex, this.hidden.length + this.outputs.length)
      if (toIndex < this.hidden.length)
        to = this.hidden[toIndex]
      else
        to = this.outputs[toIndex - this.hidden.length]

      // Check if such a Link already exists
      found = !this.links.some( link => link.from.id == from.id && link.to.id == to.id )
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, add it to the Genome and its 'to' node
    const newLink = new Link(from, to)
    this.links.push(newLink)

    return true
  }

  // Adds a random recurrent Link to this Genome
  // Returns whether the Link could be added
  addRandRecurrentLink() {
    let tries = 0
    let found = false
    let fromIndex, from, toIndex, to

    while (!found && tries++ < MAX_TRIES) {
      // Select random 'from' Node among hidden and outputs
      fromIndex = Math.randInt(1, this.hidden.length + this.outputs.length)
      if (fromIndex < this.hidden.length)
        from = this.hidden[fromIndex]
      else {
        from = this.outputs[fromIndex - this.hidden.length]
        fromIndex = this.hidden.length
      }

      // Select random 'to' Node among hidden
      toIndex = Math.randInt(0, fromIndex)
      to = this.hidden[toIndex]

      // Check if such a Link already exists
      found = !this.links.some( link => link.from.id == from.id && link.to.id == to.id )
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, add it to the Genome and its 'to' node
    const newLink = new Link(from, to, true)
    this.links.push(newLink)

    return true
  }

  // Adds a random Node to this Genome
  // Returns whether the Node could be added
  // As explained in the NEAT paper, this is done by splitting an existing
  // enabled Link (must be forward in our case) into two new Links with the
  // new Node in between
  addRandNode(availableId) {
    let tries = 0
    let found = false
    let oldIndex, oldLink

    while (!found && tries++ < MAX_TRIES) {
      // Select a random Link
      oldIndex = Math.randInt(0, this.links.length)
      oldLink = this.links[oldIndex]

      // Check if oldLink is enabled and not recurrent
      found = oldLink.isEnabled && !oldLink.isRecurrent
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, disable it and create the new Links and Node
    oldLink.isEnabled = false

    const from = oldLink.from
    const to   = oldLink.to

    const newNode = new Node(NodeTypes.HIDDEN, availableId)
    // This newNode will be positioned as close as possible to oldLink.to
    // in the Genome list
    if (to.nType === NodeTypes.OUTPUT)
      // Add to end if connected to an output Node
      this.hidden.push(newNode)
    else
      // Find the position of 'to' in the Genome list and add newNode to its left
      this.hidden.splice(this.hidden.indexOf(to), 0, newNode)
    ++this.nodeCount

    // The new weights of the Links are specified in the NEAT paper
    const newLeftLink = new Link(from, newNode, false, 1)
    const newRightLink = new Link(newNode, to, false, oldLink.weight)

    this.links.push(newLeftLink, newRightLink)

    return true
  }

}