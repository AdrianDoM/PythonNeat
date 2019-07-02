"use strict"
class Config {

  constructor(custom={}) {
    this.INPUT_NUM  = ('INPUT_NUM' in custom)  ? custom.INPUT_NUM  : 1
    this.OUTPUT_NUM = ('OUTPUT_NUM' in custom) ? custom.OUTPUT_NUM : 1
    this.POP_SIZE   = ('POP_SIZE' in custom)   ? custom.POP_SIZE   : 100

    this.STAGNANT_POP = ('STAGNANT_POP' in custom) ? custom.STAGNANT_POP : 20

    this.SIGMOID_COEFF = ('SIGMOID_COEFF' in custom) ? custom.SIGMOID_COEFF : 4.9

    this.mutators = {
      MAX_TRIES:    10,
      BIG_GENOME:   10,
      STD_DEV:      2,
      TWEAK_POINT:  0.5,
      SEVERE_POINT: 0.8,
      TWEAK_PROB:   0.7,
      SEVERE_PROB:  0.2,

      MUTATE_WEIGHTS_PROB: 0.9, // These 4 are indepentent so a Genome
      MUTATE_BIASES_PROB:  0.9, // may undergo the four mutations at once
      TOGGLE_ENABLE_PROB:  0.05,
      REENABLE_FIRST_PROB: 0.05,

      RAND_FORW_LINK_PROB: 0.05, // These 3 must add up to less than one
      RAND_REC_LINK_PROB:  0.03, // since they are disjoint probabilities
      RAND_NODE_PROB:      0.03,

      MATE_PROB:           0.75 // This determines whether a baby is the result
                                // of mutations or cross over
    }
    if ('mutators' in custom)
      this.mutators = Object.assign(this.mutators, custom.mutators)

    this.species = {
      EXCESS_COEFF:           1,
      DISJOINT_COEFF:         1,
      WEIGHTS_COEFF:          0.4,
      MAX_COMP_DIST:          3,
      STAGNANT:               15,
      BIG_SPECIES:            5,
      DROP_POINT:             0.8,
      INTERSPECIES_MATE_PROB: 0.05
    }
    if ('species' in custom)
      this.species = Object.assign(this.species, custom.species)

    if ('sizeFunc' in custom)
      this.sizeFunc = custom.sizeFunc
    else
      this.sizeFunc = genome => genome.nodeOrder.length + genome.linkIds.length

    if ('fitnessFunc' in custom)
      this.fitnessFunc = custom.fitnessFunc
    else
      this.fitnessFunc = genome => -Math.abs(genome.nodeOrder.length - 7)
  }

}