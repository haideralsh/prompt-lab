import { DisclosureGroup } from 'react-aria-components'
import { WebDisclosurePanel } from '../panels/web/web-panel'
import { SelectedFilesPanel } from '../panels/selected-files/selected-files-panel'
import { InstructionsPanel } from '../panels/instruction/instructions-panel'
import { GitPanel } from '../panels/git/git-panel'

export function Main() {
  return (
    <section className="flex-1 px-2">
      <DisclosureGroup
        defaultExpandedKeys={['selected', 'git', 'web', 'instructions']}
        allowsMultipleExpanded
      >
        <InstructionsPanel />
        <SelectedFilesPanel />
        <WebDisclosurePanel />
        <GitPanel />
      </DisclosureGroup>
    </section>
  )
}
