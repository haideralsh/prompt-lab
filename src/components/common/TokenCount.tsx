import { motion } from 'motion/react'
import { useState, useRef, useEffect } from 'react'

interface TokenCountProps {
  count: number | null | undefined
  showLabel?: boolean
}

export function TokenCount({ count, showLabel = false }: TokenCountProps) {
  const labelRef = useRef<HTMLSpanElement>(null)
  const [labelWidth, setLabelWidth] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const gap = 'var(--spacing)'

  useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.getBoundingClientRect().width)
    }
  }, [])

  return (
    <span
      className="flex items-baseline text-xs border px-1 rounded-sm uppercase text-text-dark border-border-mid overflow-hidden relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{count?.toLocaleString() ?? '-'}</span>
      {showLabel && (
        <>
          <span
            ref={labelRef}
            className="absolute invisible whitespace-nowrap lowercase"
            aria-hidden="true"
          >
            tokens
          </span>
          <motion.div
            className="overflow-hidden"
            initial={{
              marginLeft: 0,
              width: 0,
            }}
            animate={{
              marginLeft: isHovered ? gap : 0,
              width: isHovered ? labelWidth : 0,
            }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
              delay: 0.3,
            }}
          >
            <motion.span
              initial={{
                x: `calc(${labelWidth}px + ${gap})`,
                opacity: 0,
              }}
              animate={{
                x: isHovered ? 0 : `calc(${labelWidth}px + ${gap})`,
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.2, ease: 'easeOut', delay: 0.3 }}
              className="lowercase"
            >
              tokens
            </motion.span>
          </motion.div>
        </>
      )}
    </span>
  )
}
