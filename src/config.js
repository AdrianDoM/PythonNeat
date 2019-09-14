"use strict"
class Config {

  constructor(custom={}) {
    this.INPUT_NUM  = ('INPUT_NUM' in custom)  ? custom.INPUT_NUM  : 1
    this.OUTPUT_NUM = ('OUTPUT_NUM' in custom) ? custom.OUTPUT_NUM : 1
    this.POP_SIZE   = ('POP_SIZE' in custom)   ? custom.POP_SIZE   : 100

    // Number of generations a Population must show no improvement for it
    // to be considered stagnant, in which case only the top two Species
    // are allowed to reproduce
    this.STAGNANT_POP = ('STAGNANT_POP' in custom) ? custom.STAGNANT_POP : 20

    // This object cantains the parameters for handling mutation of Genomes
    this.mutators = {
      MAX_TRIES:    10,  // Maximum number of tries to find a Link or Node to mutate
      BIG_GENOME:   10,  // Minimum size for a Genome to be considered big
      STD_DEV:      2,   // Stand. deviation for Gaussian mutations

      TWEAK_POINT:  0.5, // These two points mark the portion of genes (Links and Nodes)
      SEVERE_POINT: 0.8, // that are tweaked or severed (given a new random value) during
                         // value mutations of big genomes

      TWEAK_PROB:   0.7, // These are the corresponding probabilities of value mutation
      SEVERE_PROB:  0.2, // for each gene

      MUTATE_WEIGHTS_PROB: 0.9, // These 4 are indepentent so a Genome mat undergo
      MUTATE_BIASES_PROB:  0.9, // all four mutations in the same generation
      TOGGLE_ENABLE_PROB:  0.05,
      REENABLE_FIRST_PROB: 0.05,

      RAND_FORW_LINK_PROB: 0.05, // These 3 must add up to <= 1 since they
      RAND_REC_LINK_PROB:  0.03, // are disjoint probabilities
      RAND_NODE_PROB:      0.03,

      MATE_PROB:           0.75 // This determines whether a baby is the result
                                // of mutations or cross over
    }
    if ('mutators' in custom)
      this.mutators = Object.assign(this.mutators, custom.mutators)

    // This object contains the parameters for handling Species
    this.species = {
      EXCESS_COEFF:           1,   // These three coefficients are used to compute
      DISJOINT_COEFF:         1,   // the distance between two Genomes in order to
      WEIGHTS_COEFF:          0.4, // determine if the belong in the same Species

      MAX_COMP_DIST:          3,   // The maximum distance between a new Genome and
                                   // the representative one of a Species for the new
                                   // one to be included in the same Species

      STAGNANT:               15,  // Number of generations without improvements to
                                   // be considered a stagnant Species

      BIG_SPECIES:            5,   // Number of Genomes for a Species to be considered big,
                                   // which causes the champion to be cloned into the next
                                   // generation

      DROP_POINT:             0.8, // Percent of the best Genomes that are kept in the
                                   // pool for breeding the next generation

      INTERSPECIES_MATE_PROB: 0.05 // Probability of mating between different Species
    }
    if ('species' in custom)
      this.species = Object.assign(this.species, custom.species)

    // sizeFunc is used to calculate the size of a Genome. The default one will
    // be enough for most traditional uses of the algorithm
    if ('sizeFunc' in custom)
      this.sizeFunc = custom.sizeFunc
    else
      this.sizeFunc = genome => genome.nodeOrder.length + genome.linkIds.length

    // fitnessFunc is the fuction used to calculate the fitness of Genome, which
    // it takes as its only argument. The value of this function must be positive
    // for any Genome for NEAT to work properly
    if ('fitnessFunc' in custom)
      this.fitnessFunc = custom.fitnessFunc
    else
      console.error(`No fitness function provided in ${custom}.`)
  }

}