import { DisclosureGroup } from 'react-aria-components'
import { SelectedFilesPanel } from './SelectedFilesPanel'
import { GitPanel } from './git/git-panel'
import { WebDisclosurePanel } from './web/web-panel'
import { InstructionsPanel } from './instruction/InstructionsPanel'

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
