import React from 'react'

export default function SampleRenderer(props) {
  const title = props.title || props.label || 'Component Renderer'
  return (
    <section data-ou-component="sample-renderer">
      <strong>{title}</strong>
      <pre>{JSON.stringify(props.data || {}, null, 2)}</pre>
    </section>
  )
}
