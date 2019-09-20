"use strict"

const config = new Config({
  INPUT_NUM: 2,
  OUTPUT_NUM: 1,
  POP_SIZE: 100,
  mutators: {
    BIG_GENOME: 1
  },
  fitnessFunc: g => {
    const sumSqDist = (g.feed([0,0]) - 0)**2 + (g.feed([0,1]) - 1)**2 +
      (g.feed([1,0]) - 1)**2 + (g.feed([1,1]) - 0)**2
    return Math.exp(-sumSqDist)
  }
})

const pop = Population.initPopulation(config)
console.log(pop)
pop.advance(500, 0.95, true)

console.log(pop.getChampion())

const data = pop.summary.maxFitnessHistory

// set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 30, left: 60},
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom

// append the svg object to the body of the page
const svg = d3.select("#dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")")

// Add X axis --> it is a date format
const x = d3.scaleLinear()
  .domain([0, data.length])
  .range([0, width]);
svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x))

// Add Y axis
const y = d3.scaleLinear()
  .domain([0, 1])
  .range([height, 0])
svg.append("g")
  .call(d3.axisLeft(y))

// Add the line
svg.append("path")
  .datum( d3.range(data.length) )
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 1.5)
  .attr("d", d3.line()
    .x( x )
    .y( i => y(data[i]) )
  )