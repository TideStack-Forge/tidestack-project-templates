import React from 'react'
import { createRoot } from 'react-dom/client'
import LoginPage from './LoginPage.jsx'

const rootElementId = ${esc.json(project.name)} + '-root'
const sourceName = ${esc.json(project.sourceName)}

let root = null
let rootContainer = null

function resolveMountContainer(props = {}) {
  const currentDocument = typeof document === 'undefined' ? null : document
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
    return root
  }
  if (!root) {
    root = createRoot(mountContainer)
    rootContainer = mountContainer
  }
  root.render(<LoginPage {...props} sourceName={sourceName} />)
  return root
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
  if (root) {
    root.unmount()
  }
  root = null
  rootContainer = null
}

if (typeof window !== 'undefined' && !window.__POWERED_BY_QIANKUN__) {
  render()
}
