"use strict"
class NNDiagram {

  constructor(genome, canvas, fitMode='fixed') {
    this.genome = genome
    this.canvas = canvas
    this.ctx    = canvas.getContext('2d')

    this.height  = canvas.height
    this.width   = canvas.width
    this.fitMode = fitMode // fixed, autoWidth or autoHeight

    // Fix taken from https://github.com/simonsarris/Canvas-tutorials
    this.stylePaddingLeft = parseInt(getComputedStyle(canvas, null)['paddingLeft'],     10) || 0
    this.stylePaddingTop  = parseInt(getComputedStyle(canvas, null)['paddingTop'],      10) || 0
    this.styleBorderLeft  = parseInt(getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0
    this.styleBorderTop   = parseInt(getComputedStyle(canvas, null)['borderTopWidth'],  10) || 0

    const html    = document.body.parentNode
    this.htmlTop  = html.offsetTop
    this.htmlLeft = html.offsetLeft

    this.shapes  = []
    this.hovered = null

    this.style = {
      node: {
        //             INPUT      HIDDEN     OUTPUT
        fill:        ['#326489', '#94BABA', '#F4B41F'],
        stroke:      ['#162C3D', '#576D6D', '#A87C15'],

        rProportion: 0.5,
        hoveredRProportion: 1.1,
        lineWidthProportion: 0.2,

        r: 20,
        hoveredR: 22,
        lineWidth: 4
      },

      link: {
        stroke: '#7E878C',
        hoveredStroke: '#676f73',

        lineWidthProportion: 0.5,
        hoveredLineWidthProportion: 1.5,

        lineWidth: 3,
        hoveredLineWidth: 4
      }
    }

    const thisDiagram = this

    // Fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', e => { e.preventDefault(); return false; }, false)

    // Hover effect
    canvas.addEventListener('mousemove', e => {
      const mouse = thisDiagram.getMouse(e)

      // If we were hovering a shape, check if we still are
      if (thisDiagram.hovered && thisDiagram.hovered.contains(mouse.x, mouse.y))
        return
      

      // Find if we are hovering a new shape
      for (let i = thisDiagram.shapes.length - 1; i >= 0; --i)
        if (thisDiagram.shapes[i].contains(mouse.x, mouse.y)) {
          // Stop hovering if there was another one
          if (thisDiagram.hovered) thisDiagram.hovered.setHover(false)
          // Set new hovered shape
          const shape = thisDiagram.shapes[i]
          shape.setHover(true)
          thisDiagram.hovered = shape
          thisDiagram.draw()
          return
      }

      // If nothing is hovered, reset
      if (thisDiagram.hovered) {
        thisDiagram.hovered.setHover(false)
        thisDiagram.hovered = null
        thisDiagram.draw()
        return
      }
    }, true)

    this.createShapes(fitMode)

    this.draw()
  }

  createShapes(fitMode) {
    const g = this.genome, hiddenN = g.nodeOrder.length - g.inputNum - g.outputNum,
    maxLayer = Math.max(g.inputNum, g.outputNum)
    let dy, dx

    // Handle different fit modes
    switch (fitMode) {
      case 'autoWidth':
        dy = this.height / (2 * maxLayer)
        dx = dy

        this.width = (hiddenN + 2) * 2 * dx
        this.canvas.width = this.width
        break
      
      case 'autoHeight':
        dx = this.width / ((hiddenN + 2) * 2)
        dy = dx

        this.height = maxLayer * 2 * dy
        this.canvas.height = this.height
        break

      case 'fixed':
        dy = this.height / (2 * maxLayer)
        dx = this.width / ((hiddenN + 2) * 2)
    }

    let nodeShapes = [], linkShapes = [],
    yc = this.height / 2, r = Math.min(dx, dy)
    let node, ic, x, y

    const nS = this.style.node, lS = this.style.link
    nS.r = r * nS.rProportion
    nS.hoveredR = nS.r * nS.hoveredRProportion
    nS.lineWidth = nS.r * nS.lineWidthProportion

    lS.lineWidth = nS.lineWidth * lS.lineWidthProportion
    lS.hoveredLineWidth = lS.lineWidth * lS.hoveredLineWidthProportion

    // Create input layer Nodes
    ic = g.inputNum / 2
    x = dx
    for (let i = 0; i < g.inputNum; ++i) {
      node = g.nodes[i]
      y = yc + ((i - ic) * 2 + 1) * dy
      nodeShapes.push(new NodeShape(x, y, this.style.node, node.nType, node.id, node.activation, 0))
    }

    // Create output layer Nodes
    x = ((hiddenN + 1) * 2 + 1) * dx
    ic = g.outputNum / 2
    for (let i = 0; i < g.outputNum; ++i) {
      node = g.nodes[i + g.inputNum]
      y = yc + ((i - ic) * 2 + 1) * dy
      nodeShapes.push(new NodeShape(x, y, this.style.node, node.nType, node.id, node.activation, node.bias))
    }

    // Create hidden Nodes
    x = 3 * dx
    let incomingYs
    for (let i = 0; i < hiddenN; ++i) {
      node = g.nodes[ g.nodeOrder[i + g.inputNum] ]
      incomingYs = node.incomingLinks
        .map( id => g.links[id] )
        .filter( link => !link.isRecurrent && link.isEnabled )
        .map( link => nodeShapes[link.from].y )

      if (incomingYs.length == 0) 
        y = yc
      else
        y = incomingYs.reduce( (acc, v) => acc + v ) / incomingYs.length
      
      nodeShapes[node.id] = new NodeShape(x, y, this.style.node, node.nType, node.id, node.activation, node.bias)

      x += 2 * dx
    }

    // Create the Links
    let link, nfrom, nto
    for (const linkId of g.linkIds) {
      link = g.links[linkId]
      if (!link.isEnabled || link.isRecurrent) continue // TODO: support recurrent links
      nfrom = nodeShapes[link.from]
      nto   = nodeShapes[link.to]
      linkShapes.push(new LinkShape(nfrom, nto, this.style.link, link.id, link.weight))
    }

    // Prune empty slots in nodeShapes
    nodeShapes = nodeShapes.filter( n => n != undefined )

    // Add new shapes
    this.shapes.push(...linkShapes)
    this.shapes.push(...nodeShapes)
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  draw() {
    this.clear()
    for (const shape of this.shapes) shape.draw(this.ctx)
    if (this.hovered) this.hovered.drawHover(this.ctx)

    this.redraw = false
  }

  getMouse(e) {
    // We take into account the offsets, padding and borders
    let element = this.canvas, xOff = 0, yOff = 0
    if (element.offsetParent !== undefined) {
      do {
        xOff += element.offsetLeft
        yOff += element.offsetTop
      } while ((element = element.offsetParent))
    }

    xOff += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft
    yOff += this.stylePaddingTop  + this.styleBorderTop  + this.htmlTop

    return { x: e.pageX - xOff, y: e.pageY - yOff }
  }

}

class NodeShape {

  constructor(x, y, style, type, id, activation, bias, incoming=[], outgoing=[]) {
    this.x          = x
    this.y          = y
    this.style      = style
    this.type       = type
    this.incoming   = incoming
    this.outgoing   = outgoing

    this.isHovered  = false
    this.id         = id // This is only used when a diagram is linked to a network
    this.activation = activation
    if (type != 0) this.bias = bias
  }

  draw(ctx, style) {
    const r = (this.isHovered) ? this.style.hoveredR : this.style.r

    ctx.fillStyle = this.style.fill[this.type]
    ctx.beginPath()
    ctx.arc(this.x, this.y, r, 0, 2 * Math.PI, true)
    ctx.fill()

    ctx.lineWidth   = this.style.lineWidth
    ctx.strokeStyle = this.style.stroke[this.type]
    ctx.beginPath()
    ctx.arc(this.x, this.y, r, 0, 2 * Math.PI, true)
    ctx.stroke()
  }

  drawHover(ctx, style) {
    return
  }

  contains(x, y, style) {
    const innerR = (this.isHovered) ? this.style.hoveredR : this.style.r
    const r = (innerR + this.style.lineWidth / 2), r2 = r * r,
    dx = this.x - x, dy = this.y - y

    return 1 >= (dx * dx + dy * dy) / r2
  }

  setHover(value) {
    this.isHovered = value
    this.incoming.forEach( l => l.isHovered = value )
    this.outgoing.forEach( l => l.isHovered = value )
  }

}

class LinkShape {

  constructor(from, to, style, id, weight) {
    this.from    = from
    from.outgoing.push(this)

    this.to      = to
    to.incoming.push(this)

    this.style     = style
    this.isHovered = false
    this.id        = id
    this.weight    = weight

    // For prompt computation of contains()
    this.ABx = to.x - from.x
    this.ABy = to.y - from.y
    this.AB2 = this.ABx * this.ABx + this.ABy * this.ABy
  }

  draw(ctx, style) {
    if (this.isHovered) {
      ctx.lineWidth   = this.style.hoveredLineWidth
      ctx.strokeStyle = this.style.hoveredStroke
    } else {
      ctx.lineWidth   = this.style.lineWidth
      ctx.strokeStyle = this.style.stroke
    }

    ctx.beginPath()
    ctx.moveTo(this.from.x, this.from.y)
    ctx.lineTo(this.to.x, this.to.y)
    ctx.stroke()
  }

  drawHover(ctx, style) {
    return
  }

  contains(x, y) {
    const r = ((this.isHovered) ? this.style.hoveredLineWidth : this.style.lineWidth) / 2,
    r2 = r * r,
    AXx = x - this.from.x, AXy = y - this.from.y

    let t = (AXx * this.ABx + AXy * this.ABy) / this.AB2
    t = Math.max(0, Math.min(1, t))

    const dx = t * this.ABx - AXx, dy = t * this.ABy - AXy

    return 1 >= (dx * dx + dy * dy) / r2
  }

  setHover(value) {
    this.isHovered      = value
    this.from.isHovered = value
    this.to.isHovered   = value
  }

}