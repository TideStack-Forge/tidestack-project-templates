import React from 'react'

export default function PlatformInput({ value = '', onChange }) {
  return (
    <input
      data-ou-component="platform-input"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}
