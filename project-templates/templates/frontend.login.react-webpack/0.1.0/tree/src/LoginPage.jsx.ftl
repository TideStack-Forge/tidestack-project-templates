import React, { useMemo, useState } from 'react'
import {
  buildLoginModel,
  fallbackLoginError,
  resolveLoginMessage,
  submitCredentialLogin,
  submitLdapLogin,
  startSsoLogin,
} from './authFlow.js'

const brandName = ${esc.json(brandName)}

export default function LoginPage({
  providers = [],
  locale = 'zh-CN',
  loading = false,
  loadError = null,
  login,
  loginWithLdap,
  startRedirectLogin,
  returnUrl = '/',
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const model = useMemo(() => buildLoginModel({ providers, locale }), [providers, locale])

  if (loading) {
    return <main data-login-state="loading">{resolveLoginMessage('loading', locale)}</main>
  }

  if (loadError) {
    return <main data-login-state="fallback">{fallbackLoginError(loadError)}</main>
  }

  function submitLocal(event) {
    event?.preventDefault?.()
    try {
      submitCredentialLogin({ login, username, password, returnUrl })
    } catch (error) {
      setErrorMessage(fallbackLoginError(error))
    }
  }

  function submitLdap(provider) {
    try {
      submitLdapLogin({ loginWithLdap, provider, username, password, returnUrl })
    } catch (error) {
      setErrorMessage(fallbackLoginError(error))
    }
  }

  function redirect(provider) {
    try {
      startSsoLogin({ startRedirectLogin, provider, returnUrl })
    } catch (error) {
      setErrorMessage(fallbackLoginError(error))
    }
  }

  return (
    <main data-login-entry="custom-login">
      <h1>{brandName}</h1>
      <form onSubmit={submitLocal}>
        <label>
          账号
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          密码
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="submit">本地登录</button>
      </form>
      {model.ldapProviders.map((provider) => (
        <button key={provider.id} type="button" onClick={() => submitLdap(provider)}>
          LDAP：{provider.label || provider.id}
        </button>
      ))}
      {model.redirectProviders.map((provider) => (
        <button key={provider.id} type="button" onClick={() => redirect(provider)}>
          {provider.type || provider.providerType}：{provider.label || provider.id}
        </button>
      ))}
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </main>
  )
}
