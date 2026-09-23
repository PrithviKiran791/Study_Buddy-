import React from 'react'
import { Link as RouterLink } from 'react-router-dom'

export default function Link({ href = '#', children, ...props }) {
  if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  )
}
