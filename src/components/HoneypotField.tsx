import { useId } from 'react'
import { HONEYPOT_NAME } from '../lib/spam'

interface HoneypotFieldProps {
  value: string
  onChange: (value: string) => void
}

/**
 * A hidden input that only bots fill in. See lib/spam.ts for the why.
 *
 * display:none keeps it out of the layout and off screen readers, tabIndex
 * -1 keeps it out of the keyboard path, and autoComplete="off" stops the
 * browser from helpfully filling it for a real visitor. The id is unique
 * per instance because a page can render more than one form.
 */
export default function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  const id = useId()

  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      <label htmlFor={id}>Company website (leave this field empty)</label>
      <input
        id={id}
        type="text"
        name={HONEYPOT_NAME}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  )
}
