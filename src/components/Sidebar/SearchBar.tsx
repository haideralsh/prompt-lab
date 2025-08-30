import { XIcon } from 'lucide-react'
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
    <div className="mt-3">
      <label className="sr-only" htmlFor="sidebar-search">
        Filter tree by file name
      </label>
      <div className="relative">
        {/* Search icon */}
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
          <svg
            className="h-4 w-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.9 14.32a7 7 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 9a5 5 0 11-10 0 5 5 0 0110 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>

        <input
          id="sidebar-search"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Filter tree by file name..."
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            onChange(e.target.value)
          }}
          disabled={disabled}
          className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-8 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        {/* Clear button */}
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 disabled:opacity-0 disabled:pointer-events-none"
        >
          <span className="text-base leading-none">
            <XIcon className="size-4" />
          </span>
        </button>
      </div>
    </div>
  )
}
