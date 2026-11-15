const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
const entrySource = fs.readFileSync(path.join(projectRoot, 'src/index.js'), 'utf8')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
const viteConfig = fs.readFileSync(path.join(projectRoot, 'vite.config.mjs'), 'utf8')

test('declares installable Vue renderer and form item', () => {
  assert.doesNotMatch(entrySource, /\bamis\b/i)
  assert.match(entrySource, /export function install/)
  assert.match(entrySource, /registry\.Renderer/)
  assert.match(entrySource, /registry\.FormItem/)
  assert.match(entrySource, /sample-renderer/)
  assert.match(entrySource, /sample-form-item/)
})

test('keeps required platform dependencies', () => {
  assert.ok(packageJson.dependencies.qiankun)
  assert.ok(packageJson.dependencies['ouroboros-sdk'])
  assert.equal(Object.hasOwn(packageJson.dependencies, ['am', 'is'].join('')), false)
})

test('builds an UMD component library bundle', () => {
  assert.match(viteConfig, /formats:\s*\['umd'\]/)
  assert.match(viteConfig, /fileName:\s*\(\)\s*=>\s*'static\/js\/library\.js'/)
})
