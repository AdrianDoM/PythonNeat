class Link {

  constructor(linkId, nodeFrom, nodeTo, isRecurrent, weight) {
    this.id   = linkId
    this.from = nodeFrom // Node ids
    this.to   = nodeTo
    // isRecurrent is stored mostly for labelling purposes.
    // Recursive Links are handled naturally by the implementation
    // The only special behaviour is that recurrent Links cannot be
    // split when adding a new node.
    this.isRecurrent = (isRecurrent == undefined) ? false : isRecurrent
    this.weight = (weight == undefined) ? Math.rand(-1, 1) : weight
    this.isEnabled = true
  }

}