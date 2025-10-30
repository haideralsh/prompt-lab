import { useAtomValue } from 'jotai'
import { TokenCount } from '@/components/common/token-count'
import { CopyAllButton } from './copy-all-button'
import { totalTokenCountAtom } from '@/state/atoms'

export function Header() {
  const totalTokenCount = useAtomValue(totalTokenCountAtom)

  return (
    <div className="flex items-center justify-between bg-background-dark p-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium tracking-wide text-text-dark uppercase">
          Prompt
        </span>
        <TokenCount showLabel="always" count={totalTokenCount} />
      </div>

      <div className="flex items-center gap-3 text-text-dark">
        <div className="item-center flex gap-1.5">
          <CopyAllButton />
        </div>
      </div>
    </div>
  )
}
