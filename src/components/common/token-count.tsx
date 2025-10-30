import { motion } from 'motion/react'
import { useState, useRef, useEffect } from 'react'

interface TokenCountProps {
  count: number | null | undefined
  showLabel?: boolean | 'always'
}

export function TokenCount({ count, showLabel = false }: TokenCountProps) {
  const labelRef = useRef<HTMLSpanElement>(null)
  const [labelWidth, setLabelWidth] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const gap = 'var(--spacing)'
  const shouldAlwaysShow = showLabel === 'always'
  const shouldShowOnHover = showLabel === true

  useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.getBoundingClientRect().width)
    }
  }, [])

  return (
    <span
      className={`relative flex items-center overflow-hidden rounded-sm border border-border-mid px-1 text-xs text-text-dark uppercase`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{count?.toLocaleString() ?? '-'}</span>
      {(shouldShowOnHover || shouldAlwaysShow) && (
        <>
          <span
            ref={labelRef}
            className="invisible absolute whitespace-nowrap lowercase"
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
              marginLeft: isHovered || shouldAlwaysShow ? gap : 0,
              width: isHovered || shouldAlwaysShow ? labelWidth : 0,
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
                x:
                  isHovered || shouldAlwaysShow
                    ? 0
                    : `calc(${labelWidth}px + ${gap})`,
                opacity: isHovered || shouldAlwaysShow ? 1 : 0,
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
