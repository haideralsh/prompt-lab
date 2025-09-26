import { CopyIcon, PlusIcon } from '@radix-ui/react-icons'
import { Button } from 'react-aria-components'

type WebPanelActionsProps = {
  isAddingNewPage: boolean
  onShowAddNewPress: () => void
  onCopyToClipboardPress: () => Promise<void>
}

export function WebPanelActions({
  isAddingNewPage,
  onShowAddNewPress,
  onCopyToClipboardPress,
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
      <Button
        onPress={onCopyToClipboardPress}
        className="text-text-dark/75 hover:text-text-dark data-[disabled]:text-text-dark/75"
      >
        <CopyIcon />
      </Button>
    </>
  )
}
