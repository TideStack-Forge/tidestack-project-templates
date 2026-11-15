import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'

const rootElementId = ${esc.json(project.name)} + '-root'

let app = null

function getDocument() {
  if (typeof document === 'undefined') {
    return null
  }
  return document
}

function resolveMountContainer(props = {}) {
  const currentDocument = getDocument()
  const host = props.container || currentDocument
  if (!host || typeof host.querySelector !== 'function') {
    return null
  }
  const existing = host.querySelector(`#<#noparse>${rootElementId}</#noparse>`)
  if (existing) {
    return existing
  }
  if (currentDocument && host !== currentDocument && typeof host.appendChild === 'function') {
    const nextContainer = currentDocument.createElement('div')
    nextContainer.id = rootElementId
    host.appendChild(nextContainer)
    return nextContainer
  }
  return null
}

function render(props = {}) {
  const mountContainer = resolveMountContainer(props)
  if (!mountContainer) {
    return app
  }
  if (app) {
    app.unmount()
    app = null
  }
  app = createApp(App, { hostProps: props })
  app.mount(mountContainer)
  return app
}

export async function bootstrap() {
  return undefined
}

export async function mount(props = {}) {
  render(props)
}

export async function update(props = {}) {
  render(props)
}

export async function unmount() {
  if (app) {
    app.unmount()
  }
  app = null
}

if (typeof window !== 'undefined' && !window.__POWERED_BY_QIANKUN__) {
  render()
}
