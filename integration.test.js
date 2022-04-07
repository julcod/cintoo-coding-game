const assert = require('assert')
const fs = require('fs')

const resultFile = fs.readFileSync('./src/result.js', 'utf8')

/**
 * Allow to perform a test from a file which contain parameters and result
 *
 * This function emulate the "CodinGame" test environement and eval the code
 *
 * @param {String} url Url of test definition file
 */
const testFile = (url) => {
  // Load and extract data
  const data = fs.readFileSync(url, 'utf8').split('\r\n')
  const rowCount = Number(data[0].split(' ')[0])
  const expected = data.slice(rowCount + 1)

  // Emulation of functions used in the test
  // eslint-disable-next-line
  const readline = () => {
    const line = data[0]
    data.shift()
    return line
  }

  // Hook of the console.log function to get result from the test
  const result = []
  // eslint-disable-next-line
  const console = {
    log: (v) => {
      result.push(v)
    },
  }

  // Use of eval to execute the code as it will use in 'CodinGame'
  eval(resultFile)

  // Assertion of the result
  assert.deepEqual(result, expected)
}

// UNITS TESTS

// TODO

//  INTEGRATION TESTS

describe('integration test', function () {
  const files = [
    '01-simple-mouvement',
    '02-obstacles',
    '03-priorités',
    '04-ligne-droite',
    '05-modificateurs-trajectoire',
    '06-mode-casseur',
    '07-inverseur',
    '08-téléportation',
    '09-mur-cassé',
    '10-all-together',
    '11-loop',
    '12-boucles-multiples',
  ]
  files.forEach((test) => {
    it(`should be able to run ${test}`, () => testFile(`./test/${test}.txt`))
  })
})
