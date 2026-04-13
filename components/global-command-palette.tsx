'use client'

import { CommandPalette, useCommandPalette } from './command-palette'

export function GlobalCommandPalette() {
  const { open, setOpen } = useCommandPalette()
  return <CommandPalette open={open} onClose={() => setOpen(false)} />
}
