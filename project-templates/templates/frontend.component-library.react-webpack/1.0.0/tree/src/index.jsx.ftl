import SampleFormItem from './components/SampleFormItem.jsx'
import SampleRenderer from './components/SampleRenderer.jsx'

export const componentLibraryName = ${esc.json(project.sourceName)}
export const sampleRendererType = 'sample-renderer'
export const sampleFormItemType = 'sample-form-item'

export const components = {
  renderers: {
    [sampleRendererType]: SampleRenderer,
  },
  formItems: {
    [sampleFormItemType]: SampleFormItem,
  },
}

export async function bootstrap() {
  return undefined
}

export async function mount(props = {}) {
  return props
}

export async function update(props = {}) {
  return props
}

export async function unmount() {
  return undefined
}

export function install(registry) {
  registry.Renderer?.({ type: sampleRendererType, name: sampleRendererType })(SampleRenderer)
  registry.FormItem?.({ type: sampleFormItemType, name: sampleFormItemType })(SampleFormItem)
}
