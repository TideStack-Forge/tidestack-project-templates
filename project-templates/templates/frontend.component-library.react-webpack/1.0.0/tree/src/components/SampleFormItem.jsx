import React from 'react'

export default function SampleFormItem({ value = '', onChange, placeholder = '请输入' }) {
  return (
    <input
      data-ou-component="sample-form-item"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}
