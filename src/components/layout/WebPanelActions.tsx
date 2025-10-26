import { PlusIcon } from '@radix-ui/react-icons'
import { Button } from 'react-aria-components'
import { CopyButton } from '../common/copy-button'

type WebPanelActionsProps = {
  isAddingNewPage: boolean
  onShowAddNewPress: () => void
  onCopyToClipboardPress: () => Promise<void>
  savedPagesCount: number
}

export function WebPanelActions({
  isAddingNewPage,
  onShowAddNewPress,
  onCopyToClipboardPress,
  savedPagesCount,
}: WebPanelActionsProps) {
  return (
    <>
      {!isAddingNewPage && (
        <Button
          type="button"
          onPress={onShowAddNewPress}
          className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
        >
          <PlusIcon />
        </Button>
      )}
      <CopyButton
        onCopy={onCopyToClipboardPress}
        isDisabled={savedPagesCount === 0}
      />
    </>
  )
}
