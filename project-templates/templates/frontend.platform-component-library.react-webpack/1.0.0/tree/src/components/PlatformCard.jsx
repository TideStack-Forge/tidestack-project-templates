import React from 'react'

export default function PlatformCard({ title = '平台统计', value = '-' }) {
  return (
    <section data-ou-component="platform-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </section>
  )
}
