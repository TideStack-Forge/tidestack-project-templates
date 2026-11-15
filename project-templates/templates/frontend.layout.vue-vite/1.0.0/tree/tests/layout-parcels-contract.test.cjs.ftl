const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
const entrySource = fs.readFileSync(path.join(projectRoot, 'src/layout-entry.js'), 'utf8')
const parcelSource = fs.readFileSync(path.join(projectRoot, 'src/createLayoutParcel.js'), 'utf8')
const viteConfig = fs.readFileSync(path.join(projectRoot, 'vite.config.mjs'), 'utf8')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

test('declares Vue layout parcel exports', () => {
  assert.match(entrySource, /export const topbar/)
  assert.match(entrySource, /export const sidebar/)
  assert.match(entrySource, /createLayoutParcel/)
  assert.match(parcelSource, /createApp/)
  assert.match(parcelSource, /bootstrap/)
  assert.match(parcelSource, /mount/)
  assert.match(parcelSource, /update/)
  assert.match(parcelSource, /unmount/)
})

test('keeps required platform dependencies', () => {
  assert.ok(packageJson.dependencies.qiankun)
  assert.ok(packageJson.dependencies['ouroboros-sdk'])
  assert.equal(Object.hasOwn(packageJson.dependencies, ['am', 'is'].join('')), false)
})

test('builds an UMD layout bundle', () => {
  assert.match(viteConfig, /formats:\s*\['umd'\]/)
  assert.match(viteConfig, /fileName:\s*\(\)\s*=>\s*'static\/js\/layout\.js'/)
})
