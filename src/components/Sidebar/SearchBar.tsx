import {
  Cross2Icon,
  LoopIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons'
import { SearchIcon, XIcon } from 'lucide-react'
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
    <div className="mx-2 mt-1 rounded-xs px-1.5 border border-border-dark group has-focus:border-border-mid">
      <label className="sr-only" htmlFor="sidebar-search">
        filter tree by file name
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
          <MagnifyingGlassIcon className="text-text-dark group:has-focus:text-text-light" />
        </span>

        <input
          id="sidebar-search"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            onChange(e.target.value)
          }}
          disabled={disabled}
          className="w-full text-text-light border-gray-600 py-1 pl-5.5 pr-5.5 text-sm placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
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
              <Cross2Icon className="text-text-light" />
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
