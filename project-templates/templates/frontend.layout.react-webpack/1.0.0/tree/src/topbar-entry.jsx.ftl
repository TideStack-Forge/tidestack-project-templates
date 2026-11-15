import Topbar from './components/Topbar.jsx'
import { createLayoutParcel } from './createLayoutParcel.jsx'

const lifecycle = createLayoutParcel({
  mountElementId: 'custom-topbar-container',
  parcelName: 'topbar',
  Component: Topbar,
})

export const { bootstrap, mount, update, unmount } = lifecycle
