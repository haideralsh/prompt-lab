import { DisclosureGroup } from 'react-aria-components'
import { SelectedFilesPanel } from './SelectedFilesPanel'
import { GitPanel } from './GitPanel'
import { WebDisclosurePanel } from './WebPanel'
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
