import React from 'react'

/**
 * Renders a static (read-only) star rating out of 5.
 * For editable input, pass `onChange`.
 */
export default function StarRating({ value = 0, onChange, size = 15 }) {
  const stars = [1, 2, 3, 4, 5]
  const interactive = typeof onChange === 'function'

  return (
    <span
      style={{ display: 'inline-flex', gap: 2, lineHeight: 1 }}
      aria-label={`${value} out of 5 stars`}
    >
      {stars.map((s) => {
        const filled = s <= Math.round(value)
        const Star = (
          <svg
            key={s}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill={filled ? '#c9a15a' : 'none'}
            stroke="#c9a15a"
            strokeWidth="1.2"
          >
            <path d="M10 1.5l2.55 5.4 5.95.62-4.45 4.05 1.24 5.93L10 14.7l-5.29 2.8 1.24-5.93L1.5 7.52l5.95-.62L10 1.5z" />
          </svg>
        )
        if (!interactive) return Star
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            aria-label={`Rate ${s} out of 5`}
          >
            {Star}
          </button>
        )
      })}
    </span>
  )
}
