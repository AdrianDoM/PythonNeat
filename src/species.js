"use strict"
class Species {

  constructor() {
    this.genomes = []
    this.newGenomes = []
    this.maxFitness = -Infinity
    this.sumFitness = -Infinity
    this.stagnationCount = 0
    this.offspringNum = 0
  }

  // Returns a new Species with the given Genome only
  static fromGenome(genome) {
    const newSpecies = new Species()
    newSpecies.genomes.push(genome)
    return newSpecies
  }

  // Computes the fitness of each Genome, updates maxFitness and
  // stagnationCount if necessary and sorts genomes in order of 
  // increasing fitness
  // Returns the new maximum fitness of the species
  computeFitness(config) {
    let newMaxFitness = -Infinity
    let newSumFitness = 0

    for (const genome of this.genomes) {
      genome.fitness = config.fitnessFunc(genome) / this.genomes.length
      if (genome.fitness > newMaxFitness) newMaxFitness = genome.fitness
      newSumFitness += genome.fitness
    }

    if (newMaxFitness <= this.maxFitness) ++this.stagnationCount
    else this.stagnationCount = 0

    this.maxFitness = newMaxFitness
    this.sumFitness = newSumFitness

    this.genomes.sort( (g1, g2) => g2.fitness - g1.fitness )

    return newMaxFitness
  }

  // Returs whether the Genome is compatible with this Species
  // This is done following the NEAT paper guidelines
  isCompatible(genome, config) {
    const reprGenome = this.genomes[0]
    const res = Genome.compareLinks(reprGenome, genome)
    
    const N = Math.max(config.sizeFunc(reprGenome), config.sizeFunc(reprGenome))
    const E = res.excess1.length + res.excess2.length // Actually one if the two will be 0
    const D = res.disjoint1.length + res.disjoint2.length

    let W = 0
    for (const linkId of res.matching)
      W += Math.abs(reprGenome.links[linkId].weight - genome.links[linkId].weight)
    W /= res.matching.length

    const dist = config.species.EXCESS_COEFF * E / N
               + config.species.DISJOINT_COEFF + D / N
               + config.species.WEIGHTS_COEFF * W

    return dist <= config.species.MAX_COMP_DIST
  }

  // Advance the Species one generation. This creates a new pool of Genomes which
  // are offspring or mutations of the best performing old ones
  reproduce(population, availableIds, innovations, config) {
    // If the Species is big, clone the champion to the next generation
    if (this.genomes.length >= config.species.BIG_SPECIES)
      this.newGenomes.push(this.genomes[0].clone())

    // Exclude least fit genomes
    this.genomes = this.genomes.slice(0,
      Math.round(this.genomes.length * config.species.DROP_POINT))

    // Generate the next generation of Genomes
    while (this.newGenomes.length < this.offspringNum) {

      let baby

      // MATE
      if (this.genomes.length > 1 && Math.random() < config.species.MATE_PROB) {
        // Choose a random parent
        const parent1Index = MathUtils.randInt(this.genomes.length)
        const parent1 = this.genomes[parent1Index]
        let parent2

        if (population.species.length > 1 && Math.random() < config.species.INTERSPECIES_MATE_PROB) {
          // Choose second parent to be the champion of a random Species
          // (There is a probability that the outside Species is again the current one)
          const outsideSpecies = population.species[MathUtils.randInt(population.species.length)]
          parent2 = outsideSpecies.genomes[0]
        }
        
        else {
          // Choose second parent from this Species
          let parent2Index
          do parent2Index = MathUtils.randInt(this.genome.length)
          while (parent2Index == parent1Index)
          parent2 = this.genomes[parent2Index]
        }

        baby = Mutators.mate(parent1, parent2)
      }

      // MUTATE
      else {
        // Choose a random source Genome
        const source = this.genomes[MathUtils.randInt(this.genomes.length)]
        baby = source.clone()

        const probs = config.mutators

        // STRUCTURAL MUTATIONS
        let choice = Math.random()
        if (choice < probs.RAND_FORW_LINK_PROB)
          Mutators.addRandForwardLink(baby, availableIds, innovations, config)

        else if ((choice -= probs.RAND_FORW_LINK_PROB) < probs.RAND_REC_LINK_PROB)
          Mutators.addRandRecurrentLink(baby, availableIds, innovations, config)

        else if ((choice -= probs.RAND_REC_LINK_PROB) < probs.RAND_NODE_PROB)
          Mutators.addRandNode(baby, availableIds, innovations, config)

        // VALUE MUTATIONS
        else {
          if (Math.random() < probs.MUTATE_WEIGHTS_PROB)
            Mutators.mutateWeights(baby, config)

          if (Math.random() < probs.MUTATE_BIASES_PROB)
            Mutators.mutateBiases(baby, config)

          if (Math.random() < probs.TOGGLE_ENABLE_PROB)
            Mutators.toggleEnable(baby)

          if (Math.random() < probs.REENABLE_FIRST_PROB)
            Mutators.reenableFirst(baby)
        }
      }

      // Check if the baby is compatible to this Species
      if (this.isCompatible(baby, config))
        this.newGenomes.push(baby)

      // If not, find (or create) it a compatible Species
      else {
        --this.offspringNum // The baby is moved out of this Species
        // We look for an existing Species compatible with the baby
        let found = false
        for (const species of population.species)
          if (species != this && species.isCompatible(baby, config)) {
            species.newGenomes.push(baby)
            found = true
            break
          }

        // Also check among the newly created Species
        if (!found)
          for (const species of population.newSpecies)
            if (species != this && species.isCompatible(baby, config)) {
              species.genomes.push(baby)
              found = true
              break
            }

        // If no existing Species was found we must create a new one
        if (!found) {
          const newSpecies = Species.fromGenome(baby)
          population.newSpecies.push(newSpecies)
        }
      }

    }

  }

}