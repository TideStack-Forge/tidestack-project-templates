const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
const entrySource = fs.readFileSync(path.join(projectRoot, 'src/index.jsx'), 'utf8')

test('declares installable renderer and form item', () => {
  assert.doesNotMatch(entrySource, /\bamis\b/i)
  assert.match(entrySource, /export function install/)
  assert.match(entrySource, /registry\.Renderer/)
  assert.match(entrySource, /registry\.FormItem/)
  assert.match(entrySource, /sample-renderer/)
  assert.match(entrySource, /sample-form-item/)
})
