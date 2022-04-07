const assert = require('assert')
const fs = require('fs')
//
// Hack to get all classes of the code
//
const resultFile = fs.readFileSync('./src/result.js', 'utf8')
let readline,
  classes = []
eval(resultFile)
//
// Tools to generate quick grid reader
//
const getReader = (arr)=>{
  arr = [`${arr.length} ${arr[0].length}`,...arr]
  return () =>{
    const [v,...rest] = arr
    arr = rest
    return v
  }
}
//
//
// TEST #1 : DIRECTION Object
//
describe('Unit test on Direction object', function () {
  const direction = new classes[0]()
  it(`should be SOUTH by default`, () => {
    assert.equal(direction.label, 'SOUTH')
  })
  it(`next should EAST, NORTH and WEST `, () => {
    const next = ['EAST', 'NORTH', 'WEST']
    next.forEach((v) => {
      direction.next()
      assert.equal(direction.label, v)
    })
  })
  it(`next should be 'SOUTH' (loop)`, () => {
    direction.next()
    assert.equal(direction.label, 'SOUTH')
  })
  it(`next order can be reversed`, () => {
    direction.reversePriority()
    const next = ['WEST',  'NORTH', 'EAST', 'SOUTH']
    next.forEach((v) => {
      direction.next()
      assert.equal(direction.label, v)
    })
  })
  it(`can be set by a single char`, () => {
    const next = ['WEST','NORTH', 'SOUTH', 'EAST']
    next.forEach((v) => {
      direction.set(v.charAt(0))
      assert.equal(direction.label, v)
    })
  })
})
//
// TEST #2 : MAPGRID Object
//
describe('Unit test on MapGrid object', function () {
  const grid = new classes[1](getReader([
    '######',
    '#@E $#',
    '#TN  #',
    '#X  T#',
    '######'
  ]))
  it(`should have a default position`, () => {
    assert.equal(grid.pointer, 7)
    assert.equal(grid.colCount ,6)
    assert.equal(grid.rowCount ,5)
  })
  it(`should provide info on current cell`, () => {
    const currentCell = grid.currentCell
    assert.equal(currentCell.char, "@")
    assert.equal(currentCell.index ,7)
    assert.equal(currentCell.x ,1)
    assert.equal(currentCell.y ,1)
  })
  it(`move to all next direction`, () => {
    const direction = new classes[0]()
    let nextcell = grid.next(direction)
    assert.equal(nextcell.index,13)
    grid.move(nextcell)
    // EAST
    direction.next()
    nextcell = grid.next(direction)
    assert.equal(nextcell.index,14)
    grid.move(nextcell)
    // NORTH
    direction.next()
    nextcell = grid.next(direction)
    assert.equal(nextcell.index,8)
    grid.move(nextcell)
    // WEST
    direction.next()
    nextcell = grid.next(direction)
    assert.equal(nextcell.index,7)
  })
  it(`get teleportation gates`, () => {
    const firstGate = grid.data[13]
    const secondGate = grid.getDestinationGate(firstGate)
    assert.equal(secondGate.index,22)
    assert.equal(grid.getDestinationGate(secondGate).index,13)
  })
})

