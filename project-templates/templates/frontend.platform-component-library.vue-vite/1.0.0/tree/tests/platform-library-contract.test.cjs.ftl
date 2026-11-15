const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'components.manifest.json'), 'utf8'))
const manage = JSON.parse(fs.readFileSync(path.join(projectRoot, 'manage.json'), 'utf8'))
const entrySource = fs.readFileSync(path.join(projectRoot, 'src/index.js'), 'utf8')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

test('declares installable Vue platform component library manifest', () => {
  assert.equal(manifest.name, 'platform-component-library-vue')
  assert.equal(manifest.renderers[0].name, 'sample-platform-card')
  assert.equal(manifest.formItems[0].name, 'sample-platform-input')
  assert.equal(manifest.actions[0].name, 'sample-platform-action')
  assert.equal(manifest.rules[0].name, 'samplePlatformRule')
})

test('keeps manage file aligned with manifest sections', () => {
  for (const section of ['renderers', 'formItems', 'actions', 'rules']) {
    assert.ok(Array.isArray(manage[section].disabled))
  }
})

test('exports install hook and platform dependencies', () => {
  assert.doesNotMatch(entrySource, /\bamis\b/i)
  assert.match(entrySource, /export function install/)
  assert.match(entrySource, /registry\.Renderer/)
  assert.match(entrySource, /registry\.FormItem/)
  assert.ok(packageJson.dependencies.qiankun)
  assert.ok(packageJson.dependencies['ouroboros-sdk'])
  assert.equal(Object.hasOwn(packageJson.dependencies, ['am', 'is'].join('')), false)
})
