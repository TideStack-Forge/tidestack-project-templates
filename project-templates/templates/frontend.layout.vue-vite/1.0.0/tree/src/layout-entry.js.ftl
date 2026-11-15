import { createLayoutParcel } from './createLayoutParcel.js'
import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'
import './styles.css'

export const layoutSourceName = ${esc.json(project.sourceName)}
export const topbar = createLayoutParcel({
  component: Topbar,
  rootElementId: ${esc.json(project.name)} + '-topbar',
  slotName: 'topbar',
})
export const sidebar = createLayoutParcel({
  component: Sidebar,
  rootElementId: ${esc.json(project.name)} + '-sidebar',
  slotName: 'sidebar',
})

export const bootstrap = topbar.bootstrap
export const mount = topbar.mount
export const update = topbar.update
export const unmount = topbar.unmount
