class Species {

  constructor() {
    this.genomes = []
    this.prevGenomes = []
    this.maxFitness = 0
    this.stagnationCount = 0
  }

  // Returns a new Species with the given Genome only
  static fromGenome(genome) {
    const newSpecies = new Species()
    newSpecies.genomes.push(genome)
    return newSpecies
  }

  // Computes the fitness of each Genome and updates maxFitness and
  // stagnationCount if necessary
  computeFitness(config) {
    let newMaxFitness = -Infinity

    for (genome of this.genomes) {
      genome.fitness = config.fitnessFunc(genome) / this.genomes.length
      if (genome.fitness > newMaxFitness) newMaxFitness = genome.fitness
    }

    if (newMaxFitness <= this.maxFitness) ++this.stagnationCount
    this.maxFitness = newMaxFitness
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
    for (linkId of res.matching)
      W += Math.abs(reprGenome.links[linkId].weight - genome.links[linkId].weight)
    W /= res.matching.length

    const dist = config.EXCESS_COEFF * E / N + config.DISJOINT_COEFF + D / N + config.WEIGHTS_COEFF * W
    return config.MAX_COMP_DIST <= dist
  }

}