const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
const mainSource = fs.readFileSync(path.join(projectRoot, 'src/main.js'), 'utf8')
const appSource = fs.readFileSync(path.join(projectRoot, 'src/App.vue'), 'utf8')
const viteConfig = fs.readFileSync(path.join(projectRoot, 'vite.config.mjs'), 'utf8')

test('exports qiankun-compatible lifecycle functions', () => {
  assert.match(mainSource, /export async function bootstrap/)
  assert.match(mainSource, /export async function mount/)
  assert.match(mainSource, /export async function update/)
  assert.match(mainSource, /export async function unmount/)
})

test('declares a Vue route table', () => {
  assert.match(appSource, /routeDefinitions/)
  assert.match(appSource, /path:\s*'\/'/)
  if (${esc.json(includeExampleRoute)}) {
    assert.match(appSource, /path:\s*'\/example'/)
  }
})

test('builds an UMD micro frontend app bundle', () => {
  assert.match(viteConfig, /formats:\s*\['umd'\]/)
  assert.match(viteConfig, /fileName:\s*\(\)\s*=>\s*'static\/js\/app\.js'/)
})
