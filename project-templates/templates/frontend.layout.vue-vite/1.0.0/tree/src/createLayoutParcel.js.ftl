import { createApp } from 'vue'

function getDocument() {
  if (typeof document === 'undefined') {
    return null
  }
  return document
}

function resolveMountContainer(rootElementId, props = {}) {
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

export function createLayoutParcel({ component, rootElementId, slotName }) {
  let app = null

  function render(props = {}) {
    const mountContainer = resolveMountContainer(rootElementId, props)
    if (!mountContainer) {
      return app
    }
    if (app) {
      app.unmount()
      app = null
    }
    app = createApp(component, { hostProps: props, slotName })
    app.mount(mountContainer)
    return app
  }

  return {
    async bootstrap() {
      return undefined
    },
    async mount(props = {}) {
      render(props)
    },
    async update(props = {}) {
      render(props)
    },
    async unmount() {
      if (app) {
        app.unmount()
      }
      app = null
    },
  }
}
