const NodeTypes = {
  INPUT  = 0,
  HIDDEN = 1,
  OUTPUT = 2
}

class Node {

  constructor(node_type, node_id, incoming_links, bias) {
    this.ntype = node_type
    this.id    = node_id
    this.incoming_links = (incoming_links == undefined) ? [] : incoming_links
    this.bias = (bias == undefined) ? Math.random() : bias    
  }

  activate() {
    sum = 0
    for (const link of this.incoming_links)
      if (link.from.activation != undefined)
        sum += link.from.activation * link.weight
    sum += this.bias

    // Inline sigmoid activation function
    return this.activation = 1 / (1 + Math.exp(sum))
  }

}

class Link {

  constructor(node_from, node_to, weight, is_recursive) {
    this.from = node_from
    this.to   = node_to
    this.weight = (weight == undefined) ? Math.random() : weight
    this.is_recursive = (is_recursive == undefined) ? false : is_recursive
  }

}

class Genome {

  static basic(inputnum, outputnum) {
    this.node_count = 0

    this.inputs = []
    for (let i = 0; i < inputnum; ++i)
      this.inputs.push(new Node(NodeTypes.INPUT, this.node_count++))

    this.outputs = []
    for (let i = 0; i < outputnum; ++i)
      this.outputs.push(new Node(NodeTypes.OUTPUT, this.node_count++))

    this.links = []
    for (const i of this.inputs)
      for (const o of this.outputs)
        this.links.push(new Link(i, o))
  }

}