// Wrapper object for mutator methods
const Mutators = {

  /*TODO:
    + Add doc string
    + Bias towards newer links when genome is big enough (linkCount >= inputNum * outputNum + 5)
    + Add posibility of restarting the weight randomly (again biased for newer links)
  */
  tweakWeights: function(genome, std) {
    let randSum
    genome.linkIds.forEach( linkId => {
      randSum = Math.gauss(0, std)
      genome.links[linkId].weight += randSum
    })
  },

  // TODO: + Add method to tweak node biases, similar to tweakWeights

  // Adds a random forward Link to the given Genome
  // Returns whether the Link could be added
  addRandForwardLink: function(genome, availableIds) {
    let tries = 0
    let found = false
    let fromOrderIndex, from, toOrderIndex, to

    while (!found && tries++ < MAX_TRIES) {
      // Select random 'from' Node among inputs and hidden
      fromOrderIndex = Math.randInt(0, genome.nodeCount - genome.outputNum)
      from = genome.nodeOrder[fromOrderIndex]
      fromOrderIndex = (fromOrderIndex < genome.inputNum) ? genome.inputNum : fromOrderIndex + 1

      // Select random 'to' Node among hidden and outputs
      toOrderIndex = Math.randInt(fromOrderIndex, genome.nodeCount)
      to = genome.nodeOrder[toOrderIndex]

      // Check if such a Link already exists
      found = !genome.links.some( link => link.from == from && link.to == to )
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, add it to the Genome
    genome.addLink(availableIds.link++, from, to)

    return true
  },

  // Adds a random recurrent Link to the given Genome
  // Returns whether the Link could be added
  addRandRecurrentLink: function(genome, availableIds) {
    let tries = 0
    let found = false
    let fromOrderIndex, from, toOrderIndex, to

    while (!found && tries++ < MAX_TRIES) {
      // Select random 'from' Node among hidden and outputs
      fromOrderIndex = Math.randInt(genome.inputNum + 1, genome.nodeCount)
      from = genome.nodeOrder[fromOrderIndex]
      if (fromOrderIndex >= genome.nodeCount - genome.outputNum)
        fromOrderIndex = genome.nodeCount - genome.outputNum

      // Select random 'to' Node among hidden
      toIndex = Math.randInt(genome.inputNum, fromOrderIndex)
      to = genome.nodeOrder[toOrderIndex]

      // Check if such a Link already exists
      found = !genome.links.some( link => link.from == from && link.to == to )
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, add it to the Genome
    genome.addLink(availableIds.link++, from, to, true)

    return true
  },

  // Adds a random Node to the given Genome
  // Returns whether the Node could be added
  // As explained in the NEAT paper, this is done by splitting an existing
  // enabled Link (must be forward in our case) into two new Links with the
  // new Node in between
  addRandNode: function(genome, availableIds) {
    let tries = 0
    let found = false
    let oldLinkId, oldLink

    while (!found && tries++ < MAX_TRIES) {
      // Select a random Link
      oldLinkId = genome.linkIds[Math.randInt(0, genome.linkIds.length)]
      oldLink = genome.links[oldLinkId]

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
    let orderIndex = (genome.nodes[to].nType == NodeTypes.OUTPUT) ? genome.nodeCount - genome.outputNum
      : genome.nodeOrder.indexOf(to)
    genome.addNode(NodeTypes.HIDDEN, availableIds.node, orderIndex)

    // The new weights of the Links are specified in the NEAT paper
    genome.addLink(availableIds.link++, from, availableIds.node, false, true, 1)
    genome.addLink(availableIds.link++, availableIds.node, to, false, true, oldLink.weight)

    ++availableIds.node

    return true
  }

}