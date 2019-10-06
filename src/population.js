"use strict"
class Population {

  constructor(config) {
    this.species         = [] // List of species, each species is a list of Genomes
    this.newSpecies      = []
    this.availableIds    = { node:  0, link:  0, species: 0 }
    this.generation      = 0
    this.config          = config
    
    // Innovations contains two arrays holding information about newly added nodes and links.
    // The node array is indexed by the Link id of the link that was split to create the new Node.
    // THe link array is indexed by the 
    this.innovations     = { node: [], link: [] }

    this.championSpecies = null
    this.maxFitness      = -Infinity
    this.stagnationCount = 0

    this.summary = { // Object summarizing the history of this population
      maxFitnessHistory            : [],
      speciesDistributionHitory : []
    }
  }

  static initPopulation(config) {
    const newPopulation = new Population(config)

    // Create the Genomes and split them into Species, if necessary
    let newGenome  = Genome.basic(config.INPUT_NUM, config.OUTPUT_NUM)
    newPopulation.species.push( Species.fromGenome(newGenome, newPopulation.availableIds.species++) )

    let compatibleSpecies
    for (let i = 1; i < config.POP_SIZE; ++i) {
      newGenome = Genome.basic(config.INPUT_NUM, config.OUTPUT_NUM)

      compatibleSpecies = newPopulation.species.find( s => s.isCompatible(newGenome, config) )
      // Add to current Species if compatible
      if (compatibleSpecies)
        compatibleSpecies.genomes.push(newGenome)

      // Otherwise create a new Species
      else
        newPopulation.species.push( Species.fromGenome(newGenome, newPopulation.availableIds.species++) )
    }

    // Initialise available id values for nodes and links
    // (Assumes fully connected topology is used as initial one)
    newPopulation.availableIds.node = config.INPUT_NUM + config.OUTPUT_NUM
    newPopulation.availableIds.link = config.INPUT_NUM * config.OUTPUT_NUM

    // Compute fitness
    newPopulation.updateFitness()

    // Update summary
    newPopulation.updateSummary()

    return newPopulation
  }

  // Removes stagnant Species and assigns the number of offspring to the
  // remaining Species. Species.computeFitness() must have been called already
  updateOffspringNum(verbose=false) {
    let totalSumFitness = 0
    let sumFitnesses = []

    // Compute the fitness share of each species
    for (const s of this.species) {
      sumFitnesses.push(s.sumFitness)
      totalSumFitness += s.sumFitness
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

    if (verbose) console.log('Allocated offspring distribution: ', this.species.map( s => s.offspringNum))
  }

  // Updates the fitness of each Species and Genome using the given
  // fitness function
  updateFitness() {
    let newChampionSpecies = null, 
      newMaxFitness = -Infinity
    
    for (const species of this.species)
      if (species.computeFitness(this.config) > newMaxFitness) {
        newChampionSpecies = species
        newMaxFitness = species.maxFitness
    }

    if (newMaxFitness <= this.maxFitness) ++this.stagnationCount
    else this.stagnationCount = 0

    this.championSpecies = newChampionSpecies
    this.maxFitness = newMaxFitness
  }
  
  // Transitions this Population into the next generation
  nextGen(verbose=false) {
    ++this.generation
    if (verbose) console.log(`Starting generation ${this.generation}.`)

    // If the Population is stagnant only top 2 Species mate
    if (this.stagnationCount >= this.config.STAGNANT_POP) {
      this.stagnationCount = 0
      // Sort species by maxFitness
      this.species.sort( (s1, s2) => s2.maxFitness - s1.maxFitness )
      // Keep only the top 2
      this.species = this.species.slice(0, 2)
      if (verbose) {
        console.log('Stagnant population. Keeping top 2 Species.')
        console.log(`Remaining species distribution: `, this.species.map( s => s.genomes.length ))
      }
    }

    // Remove stagnant species (unless only one remains)
    let stagnantIndex
    while (this.species.length > 1 && 0 <=
      (stagnantIndex = this.species.findIndex( s => s.stagnationCount >= this.config.species.STAGNANT )))
    {
      this.species.splice(stagnantIndex, 1)
      if (verbose) {
        console.log(`Species ${stagnantIndex} is stangant. It will be removed.`)
        console.log('Remaining species distribution: ', this.species.map( s => s.genomes.length ))
      }
    }

    // Update the number of offspring each Species will have
    this.updateOffspringNum(verbose)

    // Create the new Genomes
    if (this.config.FLUSH_INNOVATIONS) {
      this.innovations.node = []
      this.innovations.link = []
    }
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

    // Prune empty species
    let emptyIndex
    while ((emptyIndex = this.species.findIndex( s => s.genomes.length == 0 )) >= 0) {
      this.species.splice(emptyIndex, 1)
      if (verbose) {
        console.log(`Species ${emptyIndex} is empty. It will be removed.`)
        console.log('Remaining species distribution: ', this.species.map( s => s.genomes.length ))
      }
    }

    this.updateFitness()

    this.updateSummary()

    if (verbose) {
      console.log(`Gen ${this.generation} completed. Max. Fitness: ${this.maxFitness}`)
      console.log('Species distribution: ', this.species.map( s => s.genomes.length ))
      console.log('\n')
    }
  }

  // Advances this population the given number of generations
  advance(generationNum, targetFitness, summary, verbose) {
    let completedGenerations = 0, targetReached
    while (completedGenerations < generationNum) {
      this.nextGen(verbose)
      completedGenerations++
      if (this.maxFitness >= targetFitness) {
        targetReached = true
        break
      }
    }

    if (summary) {
      if (targetReached) console.log('Target fitness was reached. Stopping early.')
      console.log(`Advanced ${completedGenerations} generations. Now in generation ${this.generation}.`)
      console.log(`Maximum fitness reached in the last generation: ${this.maxFitness}.`)
      console.log('\n')
    }
  }

  updateSummary() {
    this.summary.maxFitnessHistory.push( this.maxFitness )

    const speciesDistro = []
    for (let i = 0; i < this.availableIds.species; ++i) {
      const s = this.species.find( s => s.id == i )
      speciesDistro[i] = s ? s.genomes.length : 0
    }
    this.summary.speciesDistributionHitory.push(speciesDistro)
  }

  getChampion() {
    const champion = this.championSpecies.champion
    return champion
  }

}
