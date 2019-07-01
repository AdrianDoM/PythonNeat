class Population {

  constructor(config) {
    this.species = [] // List of species, each species is a list of Genomes
    this.generation = 0
    this.config = config
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

    return newPopulation
  }

}