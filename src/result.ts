type CompassChar = 'S' | 'E' | 'N' | 'W'
type CompassPoint = {
  char: CompassChar
  label: string
  x: number
  y: number
}
/**
 * Define a direction for the Robot
 */
class Direction {
  value: number
  compass: Array<CompassPoint>
  /**
   * Offset X coordinate in grid
   */
  get x(): number {
    return this.compass[this.value].x
  }
  /**
   * Offset Y coordinate in grid
   */
  get y(): number {
    return this.compass[this.value].y
  }
  /**
   * Label used for final result print
   */
  get label(): string {
    return this.compass[this.value].label
  }
  constructor() {
    this.value = 0
    this.compass = [
      { char: 'S', label: 'SOUTH', x: 0, y: 1 },
      { char: 'E', label: 'EAST', x: 1, y: 0 },
      { char: 'N', label: 'NORTH', x: 0, y: -1 },
      { char: 'W', label: 'WEST', x: -1, y: 0 },
    ]
  }
  /**
   * Set the next direction based on compass
   */
  next(): void {
    this.value += this.value > 2 ? -3 : 1
  }
  /**
   * Restore the direction in its default value
   */
  reset(): void {
    this.value = 0
  }
  /**
   * Set the value from a character
   *
   * @param char Char to select
   */
  set(char: CompassChar): void {
    this.value = this.compass.findIndex((e) => e.char === char)
  }
  /**
   * Reverse the order of the compass
   */
  reversePriority(): void {
    this.value = 3 - this.value
    this.compass.reverse()
  }
}

// ============================================================================

type CellType =
  | 'empty'
  | 'origin'
  | 'suicide'
  | 'obstacle'
  | 'direction'
  | 'beer'
  | 'inversor'
  | 'teleport'
/**
 * Define a MapGrid cell
 */
class MapCell {
  char: string
  index: number
  x: number
  y: number
  type: CellType
  isDestroyable: boolean

  static TYPES: Map<string, CellType> = new Map([
    [' ', 'empty'],
    ['@', 'origin'],
    ['$', 'suicide'],
    ['#', 'obstacle'],
    ['X', 'obstacle'],
    ['S', 'direction'],
    ['E', 'direction'],
    ['N', 'direction'],
    ['W', 'direction'],
    ['B', 'beer'],
    ['I', 'inversor'],
    ['T', 'teleport'],
  ])

  constructor(char: string, index: number, x: number, y: number) {
    this.char = char
    this.x = x
    this.y = y
    this.index = index
    this.type = MapCell.TYPES.get(char) as CellType
    this.isDestroyable = char === 'X'
  }
  /**
   * Replace the content of a "X" cell to a " " cell
   */
  destroy() {
    this.char = ' '
    this.isDestroyable = false
    this.type = 'empty'
  }
}

// ============================================================================

type DataReader = () => string
/**
 * Define a grid for the robot's environement
 */
class MapGrid {
  rowCount: number
  colCount: number
  data: Array<MapCell>
  gates: Array<MapCell>
  pointer: number

  constructor(readline: DataReader) {
    const headers = readline().split(' ')
    this.rowCount = parseInt(headers[0])
    this.colCount = parseInt(headers[1])
    this.data = []
    this.gates = []
    this.pointer = 0
    //
    // Eval cells of the grid, the gates and the initial position
    //
    for (let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
      const row = readline()
      if (!row || row.length != this.colCount) {
        throw new Error('data mismatch')
      }
      Array.from(row).forEach((char, colIndex) => {
        const cellCount = this.data.length
        const cell = new MapCell(char, cellCount, colIndex, rowIndex)
        if (cell.type === 'teleport') {
          this.gates.push(cell)
        } else if (cell.type === 'origin') {
          this.pointer = cellCount
        }
        this.data.push(cell)
      })
    }
  }
  /**
   * Current cell from the pointer
   */
  get currentCell(): MapCell {
    return this.data[this.pointer]
  }
  /**
   * Get the next cell (from the pointer) according the direction
   *
   * @param direction Direction of the next cell
   * @returns Next cell
   */

  next(direction: Direction): MapCell {
    const currentCell = this.data[this.pointer]
    const nextX = currentCell.x + direction.x
    const nextY = currentCell.y + direction.y
    const nextPointer = nextY * this.colCount + nextX
    return this.data[nextPointer]
  }
  /**
   * Move the pointer to another cell
   *
   * @param cell Destination cell
   */
  move(cell: MapCell): void {
    this.pointer = cell.index
  }
  /**
   * Get the pairing cell of a teleport cell
   *
   * @param cell Origin cell
   * @return Destination cell
   */
  getDestinationGate(cell: MapCell): MapCell {
    const gateIndex = this.gates.indexOf(cell) ? 0 : 1
    return this.gates[gateIndex]
  }
}

// ============================================================================
/**
 * Define the Robot
 *
 * @param readline Reader given to get the raw data
 */
const Robot = class {
  direction: Direction
  target: MapCell | undefined
  map: MapGrid
  isDead: boolean
  isLooping: boolean
  isDrunk: boolean
  isMoving: boolean
  routes: Array<{ direction: string; from: number }>
  maxRunIteration: number

  constructor(readline: DataReader) {
    this.direction = new Direction()
    this.map = new MapGrid(readline)
    this.isDead = false
    this.isLooping = false
    this.isDrunk = false
    this.isMoving = false
    this.routes = []
    this.maxRunIteration = 10000
  }

  /**
   * Start the journey of the robot
   */
  start() {
    let secure = 0
    while (!this.isDead) {
      //
      // We get the next cell (according to current direction). Following
      // the type of cell, some action are performed before moving. The loop
      // run until the dead of the robot or if it's looping
      //
      let nextCell = this.map.next(this.direction)
      const char = nextCell.char
      const currentDirection = this.direction.label
      let cancelMove
      switch (nextCell.type) {
        case 'suicide':
          this.isDead = true
          break
        case 'obstacle':
          if (nextCell.isDestroyable && this.isDrunk) {
            //
            // Destroying obstable
            //
            nextCell.destroy()
          } else {
            //
            // Searching new path
            //
            if (this.isMoving) {
              this.direction.reset()
            } else {
              this.direction.next()
            }
            cancelMove = true
          }
          break
        case 'direction':
          //
          // Redirecting
          //
          this.direction.set(char as CompassChar)
          break
        case 'beer':
          //
          // Drinking
          //
          this.isDrunk = !this.isDrunk
          break
        case 'inversor':
          //
          // Invert direction
          //
          this.direction.reversePriority()
          break
        case 'teleport':
          //
          // Teleportation
          //
          nextCell = this.map.getDestinationGate(nextCell)
          break
      }
      //
      // Write route and move
      //
      if (!cancelMove) {
        this.routes.push({
          direction: currentDirection,
          from: this.map.pointer,
        })
        this.map.move(nextCell)
      }
      this.isMoving = !cancelMove
      //
      // Lazy check of looping.
      // because of the mutation of the map (destroy) and the state of the
      // robot (beer) there lot of cases to check with routes inspection.
      //
      if (secure++ > this.maxRunIteration) {
        this.isLooping = true
        this.routes = [{ direction: 'LOOP', from: -1 }]
        break
      }
    }
  }
}

// ============================================================================

// Entry point.
//
// eslint-disable-next-line
// @ts-ignore
const rl = readline
if (rl) {
  //
  // If the file is read by integration tests
  //
  const blunder = new Robot(rl)
  blunder.start()
  blunder.routes.forEach((route) => {
    console.log(route.direction)
  })
} else {
  //
  // If the file is read by unit tests
  //
  // eslint-disable-next-line
  // @ts-ignore
  classes.push(Direction, MapGrid, MapCell, Robot)
}
