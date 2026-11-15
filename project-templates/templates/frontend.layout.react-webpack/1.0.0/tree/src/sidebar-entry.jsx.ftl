import Sidebar from './components/Sidebar.jsx'
import { createLayoutParcel } from './createLayoutParcel.jsx'

const lifecycle = createLayoutParcel({
  mountElementId: 'custom-sidebar-container',
  parcelName: 'sidebar',
  Component: Sidebar,
})

export const { bootstrap, mount, update, unmount } = lifecycle
