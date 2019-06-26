class Link {

  constructor(linkId, nodeFrom, nodeTo, isRecurrent, isEnabled, weight) {
    this.id   = linkId
    this.from = nodeFrom // Node ids
    this.to   = nodeTo
    // isRecurrent is stored mostly for labelling purposes.
    // Recursive Links are handled naturally by the implementation
    // The only special behaviour is that recurrent Links cannot be
    // split when adding a new node.
    this.isRecurrent = (isRecurrent == undefined) ? false : isRecurrent
    this.isEnabled = (isEnabled == undefined) ? true : isEnabled
    this.weight = (weight == undefined) ? Math.rand(-1, 1) : weight
  }

  // Returns a copy of this Link
  clone() {
    return new Link(this.id, this.from, this.to, this.isRecurrent, this.isEnabled, this.weight)
  }

}