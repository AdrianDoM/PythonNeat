const NodeTypes = {
  INPUT:  0,
  HIDDEN: 1,
  OUTPUT: 2
}

class Node {

  constructor(nodeType, nodeId, incomingLinks, bias) {
    this.nType = nodeType
    this.id    = nodeId
    if (nodeType != NodeTypes.INPUT) {
      // incomingLinks stores Link ids
      this.incomingLinks = (incomingLinks == undefined) ? [] : incomingLinks
      this.bias = (bias == undefined) ? Math.rand(-1, 1) : bias
    }
    this.activation = 0
  }

  // Returns a deep copy of this Node
  clone() {
    if (this.nType != NodeTypes.INPUT)
      return new Node(this.nType, this.id, this.incomingLinks.slice(0), this.bias)
    return new Node(this.nType, this.id)
  }

}