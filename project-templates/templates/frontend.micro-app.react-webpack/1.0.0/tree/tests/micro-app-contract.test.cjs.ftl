const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
const mainSource = fs.readFileSync(path.join(projectRoot, 'src/main.jsx'), 'utf8')
const appSource = fs.readFileSync(path.join(projectRoot, 'src/App.jsx'), 'utf8')

test('exports qiankun-compatible lifecycle functions', () => {
  assert.match(mainSource, /export async function bootstrap/)
  assert.match(mainSource, /export async function mount/)
  assert.match(mainSource, /export async function update/)
  assert.match(mainSource, /export async function unmount/)
})

test('declares an app route table', () => {
  assert.match(appSource, /routeDefinitions/)
  assert.match(appSource, /path:\s*'\/'/)
  if (${esc.json(includeExampleRoute)}) {
    assert.match(appSource, /path:\s*'\/example'/)
  }
})
