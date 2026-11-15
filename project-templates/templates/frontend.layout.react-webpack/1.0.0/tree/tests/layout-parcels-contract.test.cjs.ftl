const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
const webpackSource = fs.readFileSync(path.join(projectRoot, 'webpack.config.js'), 'utf8')
const factorySource = fs.readFileSync(path.join(projectRoot, 'src/createLayoutParcel.jsx'), 'utf8')
const topbarEntry = fs.readFileSync(path.join(projectRoot, 'src/topbar-entry.jsx'), 'utf8')
const sidebarEntry = fs.readFileSync(path.join(projectRoot, 'src/sidebar-entry.jsx'), 'utf8')

test('build exposes topbar and sidebar parcel entries', () => {
  assert.match(webpackSource, /topbar:\s*path\.resolve/)
  assert.match(webpackSource, /sidebar:\s*path\.resolve/)
  assert.match(webpackSource, /libraryTarget:\s*'umd'/)
})

test('layout entries use initLayoutComponent through the shared factory', () => {
  assert.match(factorySource, /initLayoutComponent/)
  assert.match(topbarEntry, /custom-topbar-container/)
  assert.match(sidebarEntry, /custom-sidebar-container/)
})
