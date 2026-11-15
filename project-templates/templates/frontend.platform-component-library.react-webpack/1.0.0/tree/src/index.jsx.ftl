import PlatformCard from './components/PlatformCard.jsx'
import PlatformInput from './components/PlatformInput.jsx'

export const libraryName = ${esc.json(project.libraryName)}
export const platformRendererType = 'sample-platform-card'
export const platformFormItemType = 'sample-platform-input'

export const components = {
  renderers: {
    [platformRendererType]: PlatformCard,
  },
  formItems: {
    [platformFormItemType]: PlatformInput,
  },
}

export function install(registry) {
  registry.Renderer?.({ type: platformRendererType, name: platformRendererType })(PlatformCard)
  registry.FormItem?.({ type: platformFormItemType, name: platformFormItemType })(PlatformInput)
  registry.registerAction?.('sample-platform-action', () => ({ ok: true, libraryName }))
  registry.registerValidator?.('samplePlatformRule', (value) => Boolean(value))
}
