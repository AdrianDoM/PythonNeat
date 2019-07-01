function Config(custom={}) {
  this.INPUT_NUM  = ('INPUT_NUM' in custom)  ? custom.INPUT_NUM  : 1
  this.OUTPUT_NUM = ('OUTPUT_NUM' in custom) ? custom.OUTPUT_NUM : 1
  this.POP_SIZE   = ('POP_SIZE' in custom)   ? custom.POP_SIZE   : 100

  this.mutators = {
    MAX_TRIES:    10,
    BIG_GENOME:   10,
    STD_DEV:      2,
    TWEAK_POINT:  0.5,
    SEVERE_POINT: 0.8,
    TWEAK_PROB:   0.5,
    SEVERE_PROB:  0.3
  }
  if ('mutators' in custom)
    this.mutators = Object.assign(this.mutators, custom.mutators)

  this.species = {
    EXCESS_COEFF:   1,
    DISJOINT_COEFF: 1,
    WEIGHTS_COEFF:  0.4,
    MAX_COMP_DIST:  3
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
    this.fitnessFunc = genome => 0
}