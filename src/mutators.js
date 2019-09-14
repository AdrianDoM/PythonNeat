"use strict"
// Wrapper object for mutator methods
const Mutators = {

  // Mutates the Link weights in a genome
  // For big genomes this is biased towards the newer Links
  // Mutation may tweak the weight (add a std normal rv to it),
  // or severe it completely (reset it to a new random value in [-1,1))
  mutateWeights: function(genome, config) {
    const BIG_GENOME = genome.inputNum * genome.outputNum + config.mutators.BIG_GENOME

    if (genome.linkIds.length < BIG_GENOME) {
      // Small genome: treat all links equally
      genome.linkIds.forEach( linkId => {
        const link = genome.links[linkId]
        const choice = Math.random()

        if (choice < config.mutators.SEVERE_PROB)
          link.weight = MathUtils.rand(-1, 1)

        else if (choice < config.mutators.SEVERE_PROB + config.mutators.TWEAK_PROB)
          link.weight += MathUtils.gauss(0, config.mutators.STD_DEV)
      })
    }

    else {
      // Big genome: bias mutations towards newer links
      const TWEAK_POINT = Math.ceil(config.mutators.TWEAK_POINT * genome.linkIds.length)
      const SEVERE_POINT = Math.ceil(config.mutators.SEVERE_POINT * genome.linkIds.length)

      for (let i = TWEAK_POINT; i < genome.linkIds.length; ++i) {
        const link = genome.links[genome.linkIds[i]]
        const choice = Math.random()

        if (i < SEVERE_POINT) {
          // Just consider tweaking
          if (choice < config.mutators.TWEAK_PROB)
            link.weight += MathUtils.gauss(0, config.mutators.STD_DEV)
        }

        else {
          // Consider both tweaking and severing
          if (choice < config.mutators.SEVERE_PROB)
            link.weight = MathUtils.rand(-1, 1)

          else if (choice < config.mutators.SEVERE_PROB + config.mutators.TWEAK_PROB)
            link.weight += MathUtils.gauss(0, config.mutators.STD_DEV)
        }
      }
    }
  },

  // Mutates the Node biases in a genome
  // For big genomes this is biased towards nodes with higher Id
  // (probably newer but nconfigot necessarily)
  // Mutation may tweak the bias (add a std normal rv to it),
  // or severe it completely (reset it to a new random value in [-1,1))
  mutateBiases: function(genome, config) {
    const BIG_GENOME = genome.inputNum + genome.outputNum + config.mutators.BIG_GENOME

    if (genome.nodeOrder.length < BIG_GENOME) {
      // Small genome: treat all nodes equally
      genome.nodeOrder.forEach( nodeId => {
        const node = genome.nodes[nodeId]
        const choice = Math.random()

        if (choice < config.mutators.SEVERE_PROB)
          node.bias = MathUtils.rand(-1, 1)

        else if (choice < config.mutators.SEVERE_PROB + config.mutators.TWEAK_PROB)
          node.bias += MathUtils.gauss(0, config.mutators.STD_DEV)
      })
    }

    else {
      // Big genome: bias mutations towards nodes with higher id
      const TWEAK_POINT = Math.ceil(config.mutators.TWEAK_POINT * genome.nodeOrder.length)
      const SEVERE_POINT = Math.ceil(config.mutators.SEVERE_POINT * genome.nodeOrder.length)

      const nodeIds = genome.nodeOrder.slice(0).sort( (a, b) => a - b )

      for (let i = TWEAK_POINT; i < genome.nodeOrder.length; ++i) {
        const node = genome.nodes[nodeIds[i]]
        const choice = Math.random()

        if (i < SEVERE_POINT) {
          // Just consider tweaking
          if (choice < config.mutators.TWEAK_PROB)
            node.bias += MathUtils.gauss(0, config.mutators.STD_DEV)
        }

        else {
          // Consider both tweaking and severing
          if (choice < config.mutators.SEVERE_PROB)
            node.bias = MathUtils.rand(-1, 1)

          else if (choice < config.mutators.SEVERE_PROB + config.mutators.TWEAK_PROB)
            node.bias += MathUtils.gauss(0, config.mutators.STD_DEV)
        }
      }
    }
  },

  // Select a random Link in the given genome and toggle its isEnabled
  // property. When disabling a Link, we first check if doing so would
  // lead to a Node having no outgoing Link (redering it useless)
  toggleEnable: function(genome) {
    const linkId = genome.linkIds[MathUtils.randInt(genome.linkIds.length)]
    const link = genome.links[linkId]

    if (!link.isEnabled) link.isEnabled = true

    else {
      // Check if the 'in' Node has any other outgoing Links
      const inNodeId = link.from
      const safeToDisable = genome.linkIds.some( linkId2 =>
        genome.links[linkId2].from == inNodeId && linkId2 != linkId )

      if (safeToDisable) link.isEnabled = false
    }
  },

  // Enables the first disabled Link in the genome
  reenableFirst: function(genome) {
    const firstId = genome.linkIds.find( linkId => genome.links[linkId].isEnabled == false )
    if (firstId) genome.links[firstId].isEnabled = true
  },

  // Adds a random forward Link to the given Genome
  // Returns whether the Link could be added
  addRandForwardLink: function(genome, availableIds, innovations, config) {
    let tries = 0
    let found = false
    let fromOrderIndex, from, toOrderIndex, to

    while (!found && tries++ < config.mutators.MAX_TRIES) {
      // Select random 'from' Node among inputs and hidden
      fromOrderIndex = MathUtils.randInt(0, genome.nodeOrder.length - genome.outputNum)
      from = genome.nodeOrder[fromOrderIndex]
      fromOrderIndex = (fromOrderIndex < genome.inputNum) ? genome.inputNum : fromOrderIndex + 1

      // Select random 'to' Node among hidden and outputs
      toOrderIndex = MathUtils.randInt(fromOrderIndex, genome.nodeOrder.length)
      to = genome.nodeOrder[toOrderIndex]

      // Check if such a Link already exists
      found = !genome.links.some( link => link.from == from && link.to == to )
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, add it to the Genome
    // Check innovations to decide whether to use a new id
    let id
    if (from in innovations.link) {
      if (to in innovations.link[from])
        // Use the already existing id
        id = innovations.link[from][to]
      else {
        // Use new id
        id = availableIds.link++
        innovations.link[from][to] = id
      }
    } else {
      // Use new id
      id = availableIds.link++
      (innovations.link[from] = [])[to] = id
    }

    genome.addLink(id, from, to)

    return true
  },

  // Adds a random recurrent Link to the given Genome
  // Returns whether the Link could be added
  addRandRecurrentLink: function(genome, availableIds, innovations, config) {
    let tries = 0
    let found = false
    let fromOrderIndex, from, toOrderIndex, to

    while (!found && tries++ < config.mutators.MAX_TRIES) {
      // Select random 'from' Node among hidden and outputs
      fromOrderIndex = MathUtils.randInt(genome.inputNum + 1, genome.nodeOrder.length)
      from = genome.nodeOrder[fromOrderIndex]
      if (fromOrderIndex >= genome.nodeOrder.length - genome.outputNum)
        fromOrderIndex = genome.nodeOrder.length - genome.outputNum

      // Select random 'to' Node among hidden
      toOrderIndex = MathUtils.randInt(genome.inputNum, fromOrderIndex)
      to = genome.nodeOrder[toOrderIndex]

      // Check if such a Link already exists
      found = !genome.links.some( link => link.from == from && link.to == to )
    }

    // Stop if no suitable Link was found
    if (!found) return false

    // If a Link was found, add it to the Genome
    // Check innovations to decide whether to use a new id
    let id
    if (from in innovations.link) {
      if (to in innovations.link[from])
        // Use the already existing id
        id = innovations.link[from][to]
      else {
        // Use new id
        id = availableIds.link++
        innovations.link[from][to] = id
      }
    } else {
      // Use new id
      id = availableIds.link++
      (innovations.link[from] = [])[to] = id
    }

    genome.addLink(id, from, to)

    return true
  },

  // Adds a random Node to the given Genome
  // Returns whether the Node could be added
  // As explained in the NEAT paper, this is done by splitting an existing
  // enabled Link (must be forward in our case) into two new Links with the
  // new Node in between
  addRandNode: function(genome, availableIds, innovations, config) {
    let tries = 0
    let found = false
    let oldLinkId, oldLink

    while (!found && tries++ < config.mutators.MAX_TRIES) {
      // Select a random Link
      oldLinkId = genome.linkIds[MathUtils.randInt(0, genome.linkIds.length)]
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

    // Check innovations to decide whether to use a new ids
    let id, leftId, rightId
    if (oldLinkId in innovations.node) {
      // Use old ids
      id = innovations.node[oldLinkId].id
      leftId = innovations.node[oldLinkId].leftId
      rightId = innovations.node[oldLinkId].rightId
    } else {
      // Use new ids
      id = availableIds.node++
      leftId = availableIds.link++
      rightId = availableIds.link++
      innovations.node[oldLinkId] = {id, leftId, rightId}
    }

    // The new Node will be positioned as close as possible to oldLink.to
    // in the Genome list
    let orderIndex = (genome.nodes[to].nType == NodeTypes.OUTPUT)
      ? genome.nodeOrder.length - genome.outputNum
      : genome.nodeOrder.indexOf(to)
    genome.addNode(NodeTypes.HIDDEN, id, orderIndex)

    // The new weights of the Links are specified in the NEAT paper
    genome.addLink(leftId, from, id, false, true, 1)
    genome.addLink(rightId, id, to, false, true, oldLink.weight)

    return true
  },

  // Returns the outcome of mating the two given parents
  // Crossing over is performed as outlined in the NEAT paper
  // The paper is vague in this regard, so a few assumptions and interpretations
  // have been made, generally favouring simplicity of the algorithm
  mate: function(parent1, parent2) {
    // Set parent1 to be the fittest (or a random one if their fitness is equal)
    if (parent2.fitness > parent1.fitness) {
      const temp = parent2
      parent2 = parent1
      parent1 = temp
    } else if (parent1.fitness == parent2.fitness)
      if (MathUtils.randInt(2)) {
        const temp = parent2
        parent2 = parent1
        parent1 = temp
      }

    const baby = new Genome()

    baby.inputNum  = parent1.inputNum
    baby.outputNum = parent1.outputNum

    // Genome structure is inherited from the fittest parent
    baby.nodeOrder = parent1.nodeOrder.slice(0)
    baby.linkIds   = parent1.linkIds.slice(0)

    // Individual Nodes and Links are selected randomly when present in both parents
    baby.nodeOrder.forEach( nodeId => {
      if (nodeId in parent2.nodes)
        baby.nodes[nodeId] =
          [parent1.nodes[nodeId], parent2.nodes[nodeId]][MathUtils.randInt(2)].clone()
      
      else
        baby.nodes[nodeId] = parent1.nodes[nodeId].clone()
    })

    baby.linkIds.forEach( linkId => {
      if (linkId in parent2.links)
        baby.links[linkId] =
          [parent1.links[linkId], parent2.links[linkId]][MathUtils.randInt(2)].clone()

      else
        baby.links[linkId] = parent1.links[linkId].clone()
    })

    return baby    
  }

}