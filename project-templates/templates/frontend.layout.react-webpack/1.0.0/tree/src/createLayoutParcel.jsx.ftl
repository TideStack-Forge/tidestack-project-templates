import React from 'react'
import { createRoot } from 'react-dom/client'
import { initLayoutComponent } from 'ouroboros-sdk'
import './styles.css'

const sourceName = ${esc.json(project.sourceName)}

function getDocument() {
  if (typeof document === 'undefined') {
    return null
  }
  return document
}

function resolveMountContainer(props, mountElementId) {
  const currentDocument = getDocument()
  const host = props.container || currentDocument

  if (!host || typeof host.querySelector !== 'function') {
    return null
  }

  const existing = host.querySelector(`#<#noparse>${mountElementId}</#noparse>`)
  if (existing) {
    return existing
  }

  if (currentDocument && host !== currentDocument && typeof host.appendChild === 'function') {
    const nextContainer = currentDocument.createElement('div')
    nextContainer.id = mountElementId
    host.appendChild(nextContainer)
    return nextContainer
  }

  return null
}

export function createLayoutParcel({ mountElementId, parcelName, Component }) {
  let root = null
  let rootContainer = null

  function render(props = {}) {
    const mountContainer = resolveMountContainer(props, mountElementId)
    if (!mountContainer) {
      return root
    }

    if (root && rootContainer !== mountContainer) {
      root.unmount()
      root = null
      rootContainer = null
    }

    if (!root) {
      root = createRoot(mountContainer)
      rootContainer = mountContainer
    }

    root.render(<Component {...props} parcelName={parcelName} sourceName={sourceName} />)
    return root
  }

  return initLayoutComponent({
    render,
    afterUpdate(props) {
      render(props)
    },
    afterUnmount() {
      if (root) {
        root.unmount()
      }
      root = null
      rootContainer = null
    },
  })
}
