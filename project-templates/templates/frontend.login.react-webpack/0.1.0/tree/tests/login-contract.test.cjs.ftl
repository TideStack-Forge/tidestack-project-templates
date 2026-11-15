const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')
const authFlowSource = fs.readFileSync(path.join(projectRoot, 'src/authFlow.js'), 'utf8')
const loginPageSource = fs.readFileSync(path.join(projectRoot, 'src/LoginPage.jsx'), 'utf8')
const mainSource = fs.readFileSync(path.join(projectRoot, 'src/main.jsx'), 'utf8')

test('declares custom login auth journeys', () => {
  assert.match(authFlowSource, /submitCredentialLogin/)
  assert.match(authFlowSource, /submitLdapLogin/)
  assert.match(authFlowSource, /loginWithLdap/)
  assert.match(authFlowSource, /startSsoLogin/)
  assert.match(authFlowSource, /startRedirectLogin/)
  assert.match(authFlowSource, /CAS/)
  assert.match(authFlowSource, /OAUTH2/)
  assert.match(authFlowSource, /OIDC/)
  assert.match(authFlowSource, /resolveReturnUrl/)
})

test('keeps i18n and fallback behavior in generated page', () => {
  assert.match(authFlowSource, /zh-CN/)
  assert.match(authFlowSource, /en-US/)
  assert.match(authFlowSource, /fallbackLoginError/)
  assert.match(loginPageSource, /data-login-state="loading"/)
  assert.match(loginPageSource, /data-login-state="fallback"/)
})

test('exports qiankun-compatible login app lifecycle', () => {
  assert.match(mainSource, /export async function bootstrap/)
  assert.match(mainSource, /export async function mount/)
  assert.match(mainSource, /export async function update/)
  assert.match(mainSource, /export async function unmount/)
})
