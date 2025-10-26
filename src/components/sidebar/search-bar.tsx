import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useState } from 'react'

interface SearchBarProps {
  onChange(value: string): void
  onClear(): void
  onNavigateOut?: () => void
  disabled?: boolean
}

export function SearchBar({
  onChange,
  onClear,
  onNavigateOut,
  disabled = false,
}: SearchBarProps) {
  const [value, setValue] = useState('')

  function clear() {
    if (!value.trim()) return

    setValue('')
    onClear()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      onNavigateOut?.()
    }
  }

  return (
    <div className="sticky z-10 top-0 p-2 bg-background-dark transition-colors">
      <div className="px-1.5 rounded-sm group bg-interactive-mid has-focus:bg-interactive-light">
        <label className="sr-only" htmlFor="sidebar-search">
          filter tree by file name
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
            <MagnifyingGlassIcon className="text-text-dark group-has-focus:text-text-light" />
          </span>

          <input
            id="sidebar-search"
            type="text"
            placeholder="Filter by name"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              onChange(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="placeholder:text-sm placeholder:text-solid-light w-full text-text-light py-1 pl-5.5 pr-5.5 text-sm focus:outline-none"
          />

          {/* Clear button */}
          {value.trim() && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex items-center text-text-dark hover:text-text-light disabled:opacity-0 disabled:pointer-events-none focus:outline-none group"
            >
              <span className="text-base leading-none rounded-sm group-focus-visible:ring-2 group-focus-visible:ring-accent-border-light">
                <Cross2Icon className="text-text-dark group-has-focus:text-text-light" />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
