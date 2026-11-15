import { h } from 'vue'
import './styles.css'

export const componentLibraryName = ${esc.json(project.sourceName)}
export const sampleRendererType = 'sample-renderer'
export const sampleFormItemType = 'sample-form-item'

export function SampleRenderer(props = {}) {
  return h(
    'section',
    { class: 'ouroboros-component-renderer', 'data-ou-component': 'sample-renderer' },
    [
      h('strong', props.title || props.label || 'Vue Component Renderer'),
      h('pre', JSON.stringify(props.data || {}, null, 2)),
    ],
  )
}

export function SampleFormItem(props = {}) {
  return h('input', {
    class: 'ouroboros-component-input',
    'data-ou-component': 'sample-form-item',
    value: props.value || '',
    placeholder: props.placeholder || '请输入',
    onInput: (event) => props.onChange?.(event.target.value),
  })
}

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
