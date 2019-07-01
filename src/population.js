class Population {

  constructor(config) {
    this.species = [] // List of species, each species is a list of Genomes
    this.generation = 0
    this.config = config
  }

  static initPopulation(config) {
    const pop = new Population(config)
    
  }

}