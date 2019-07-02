class Population {

  constructor(config) {
    this.species         = [] // List of species, each species is a list of Genomes
    this.newSpecies      = []
    this.innovations     = { node: [], link: [] }
    this.availableIds    = { node:  0, link:  0 }
    this.generation      = 0
    this.config          = config
    this.maxFitness      = -Infinity
    this.stagnationCount = 0
  }

  static initPopulation(config) {
    const newPopulation = new Population(config)

    // Create the Genomes and split them into Species, if necessary
    let newGenome  = Genome.basic(config.INPUT_NUM, config.OUTPUT_NUM)
    let newSpecies = Species.fromGenome(newGenome)
    newPopulation.species.push(newSpecies)

    for (let i = 1; i < config.POP_SIZE; ++i) {
      newGenome = Genome.basic(config.INPUT_NUM, config.OUTPUT_NUM)

      // Add to current Species if compatible
      if (newSpecies.isCompatible(newGenome, config))
        newSpecies.genomes.push(newGenome)

      // Otherwise create a new Species
      else {
        newSpecies = Species.fromGenome(newGenome)
        newPopulation.species.push(newSpecies)
      }
    }

    newPopulation.availableIds.node = config.INPUT_NUM + config.OUTPUT_NUM
    newPopulation.availableIds.link = config.INPUT_NUM * config.OUTPUT_NUM

    return newPopulation
  }

  // Removes stagnant Species and assigns the number of offspring to the
  // remaining Species. Species.computFitness() must have been called already
  updateOffspringNum() {
    // Compute proportion of Genomes in each Species according to their fitness
    let totalSumFitness = 0
    let sumFitnesses = []
    for (let i = 0; i < this.species.length; ++i) {
      // If the Species is stagnant, remove it
      if (this.species[i].stagnationCount >= this.config.species.STAGNANT)
        this.species.splice(i, 1)
      // Otherwise take its fitness into account
      else {
        sumFitnesses.push(this.species.sumFitnesses)
        totalSumFitness += this.species.sumFitnesses
      }
    }

    // Compute the proportion of the offspring of each remaining Species
    sumFitnesses = sumFitnesses.map( x => x / totalSumFitness )

    // Assign the number of offspring to each Species
    let remainingOffspring = this.config.POP_SIZE
    for (let i = 0; i < this.species.length - 1; ++i) {
      this.species[i].offspringNum = Math.round(sumFitnesses[i] * this.config.POP_SIZE)
      remainingOffspring -= this.species[i].offspringNum
    }
    this.species[this.species.length - 1].offspringNum = remainingOffspring
  }

  // Transitions this Population into the next generation
  nextGen() {
    // Otherwise, the Population is stagnant and only top 2 Species mate
    if (this.stagnationCount >= this.config.STAGNANT_POP) {
      // Sort species by maxFitness
      this.species.sort( (s1, s2) => s2.maxFitness - s1.maxFitness )
      // Keep only the top 2
      this.species = this.species.slice(0, 2)
    }

    // Update the number of offspring each Species will have
    this.updateOffspringNum()

    // Create the new Genomes
    this.species.forEach( species =>
      species.reproduce(this, this.availableIds, this.innovations, this.config) )

    // Once all Species are done, update their Genome lists
    this.species.forEach( species => {
      species.genomes = species.newGenomes
      species.newGenomes = []
    })

    // Add the new Species to the list
    this.species.push(...this.newSpecies)
    this.newSpecies = []

    // Update fitness
    const newMaxFitness = Math.max(...this.species.map( species => species.computeFitness(config) ))
    if (newMaxFitness <= this.maxFitness) ++this.stagnationCount
    else this.stagnationCount = 0

    ++this.generation
  }

  // Advances this population the given number of generations
  advance(generationNum) {
    while (generationNum-- > 0)
      this.nextGen()
  }

}