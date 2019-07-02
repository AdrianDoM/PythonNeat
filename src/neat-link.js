"use strict"
class Link {

  constructor(linkId, nodeFrom, nodeTo, isRecurrent=false, isEnabled=true, weight=MathUtils.rand(-1, 1)) {
    this.id   = linkId
    this.from = nodeFrom // Node ids
    this.to   = nodeTo
    // isRecurrent is stored mostly for labelling purposes.
    // Recursive Links are handled naturally by the implementation
    // The only special behaviour is that recurrent Links cannot be
    // split when adding a new node.
    this.isRecurrent = isRecurrent
    this.isEnabled = isEnabled
    this.weight = weight
  }

  // Returns a copy of this Link
  clone() {
    return new Link(this.id, this.from, this.to, this.isRecurrent, this.isEnabled, this.weight)
  }

}