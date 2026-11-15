import { h } from 'vue'
import './styles.css'

export const libraryName = ${esc.json(project.libraryName)}
export const platformRendererType = 'sample-platform-card'
export const platformFormItemType = 'sample-platform-input'

export function PlatformCard(props = {}) {
  return h(
    'section',
    { class: 'ouroboros-platform-card', 'data-ou-component': 'platform-card' },
    [
      h('span', '平台指标'),
      h('strong', props.value || '42'),
      h('small', props.title || '活跃用户'),
    ],
  )
}

export function PlatformInput(props = {}) {
  return h('input', {
    class: 'ouroboros-platform-input',
    'data-ou-component': 'platform-input',
    value: props.value || '',
    placeholder: props.placeholder || '请输入',
    onInput: (event) => props.onChange?.(event.target.value),
  })
}

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
