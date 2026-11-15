export const loginSourceName = ${esc.json(project.sourceName)}

const messages = {
  'zh-CN': {
    loading: '正在加载登录方式...',
    failed: '登录方式加载失败，请稍后重试。',
    invalidCredentials: '用户名或密码不正确。',
  },
  'en-US': {
    loading: 'Loading login methods...',
    failed: 'Failed to load login methods. Please try again later.',
    invalidCredentials: 'Invalid username or password.',
  },
}

function normalizeProviderType(provider) {
  return String(provider?.type || provider?.providerType || '').toUpperCase()
}

export function resolveReturnUrl(input) {
  if (!input) {
    return '/'
  }
  if (input.startsWith('/')) {
    return input
  }
  const url = new URL(input, 'https://ouroboros.local')
  return url.searchParams.get('returnUrl') || url.searchParams.get('redirect_uri') || '/'
}

export function listExternalProviders(providers = []) {
  return providers.filter((provider) => ['CAS', 'OAUTH2', 'OIDC'].includes(normalizeProviderType(provider)))
}

export function buildLoginModel({ providers = [], locale = 'zh-CN' } = {}) {
  return {
    sourceName: loginSourceName,
    locale,
    localProvider: providers.find((provider) => normalizeProviderType(provider) === 'LOCAL') || null,
    ldapProviders: providers.filter((provider) => normalizeProviderType(provider) === 'LDAP'),
    redirectProviders: listExternalProviders(providers),
  }
}

export function submitCredentialLogin({ login, username, password, returnUrl = '/' }) {
  if (typeof login !== 'function') {
    throw new Error('login adapter is required')
  }
  return login({
    username,
    password,
    returnUrl: resolveReturnUrl(returnUrl),
  })
}

export function submitLdapLogin({ loginWithLdap, provider, username, password, returnUrl = '/' }) {
  if (typeof loginWithLdap !== 'function') {
    throw new Error('loginWithLdap adapter is required')
  }
  return loginWithLdap({
    providerId: provider?.id,
    username,
    password,
    returnUrl: resolveReturnUrl(returnUrl),
  })
}

export function startSsoLogin({ startRedirectLogin, provider, returnUrl = '/' }) {
  if (typeof startRedirectLogin !== 'function') {
    throw new Error('startRedirectLogin adapter is required')
  }
  const providerType = normalizeProviderType(provider)
  if (!['CAS', 'OAUTH2', 'OIDC'].includes(providerType)) {
    throw new Error(`unsupported redirect provider: <#noparse>${providerType}</#noparse>`)
  }
  return startRedirectLogin({
    providerId: provider.id,
    providerType,
    returnUrl: resolveReturnUrl(returnUrl),
  })
}

export function resolveLoginMessage(code, locale = 'zh-CN') {
  return messages[locale]?.[code] || messages['zh-CN'][code] || code
}

export function fallbackLoginError(error) {
  return error?.message || resolveLoginMessage('failed')
}
