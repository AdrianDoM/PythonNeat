"use strict"
let test_count    = 0
let success_count = 0

const eps = 1e-8

// Performs a TEST checking if the two provided objects are equal
function testEquals(result, expected, test_name) {
  ++test_count
  if (result === expected) {
    ++success_count
    return true
  }
  console.error(test_name + ' failed!', 'Expected:', expected, 'But got:', result)
  return false
}

// Helper function to test if a Number if within epsilon of another
Number.prototype.within = function(x) {
  return x - eps <= this && this <= x + eps
}

// Performs a TEST checking if the two provided Arrays of Numbers
// are equal to within epsilon
function testNumArrayEquals(result, expected, test_name) {
  ++test_count
  if (result.every( (res, i) => res.within(expected[i]) )) {
    ++success_count
    return true
  }
  console.error(test_name + ' failed!', 'Expected:', expected, 'But got:', result)
  return false
}

// Performs a TEST checking if all the elements of the provided
// tests Array are true
function testAllTrue(tests, test_name) {
  ++test_count

  const success = tests.every(x => x)

  if (success) {
    ++success_count
    return true
  }
  console.error(test_name + ' failed!', 'Not all true:', tests)
  return false
}
