import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useState } from 'react'

interface SearchBarProps {
  onChange(value: string): void
  onClear(): void
  disabled?: boolean
}

export function SearchBar({
  onChange,
  onClear,
  disabled = false,
}: SearchBarProps) {
  const [value, setValue] = useState('')

  function clear() {
    if (!value.trim()) return

    setValue('')
    onClear()
  }

  return (
    <div className="sticky top-0 p-2 bg-background-light transition-colors">
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
            disabled={disabled}
            className="placeholder:text-sm placeholder:text-solid-light w-full text-text-light py-1 pl-5.5 pr-5.5 text-sm focus:outline-none"
          />

          {/* Clear button */}
          {value.trim() && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-0 disabled:pointer-events-none"
            >
              <span className="text-base leading-none">
                <Cross2Icon className="text-text-dark group-has-focus:text-text-light" />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
