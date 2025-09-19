import { DisclosureGroup } from 'react-aria-components'
import { SelectedFilesPanel } from './SelectedFilesPanel'
import { GitPanel } from './GitPanel'
import { WebDisclosurePanel } from './WebDisclosurePanel'

export function Main() {
  return (
    <section className="flex-1 px-2 bg-background-dark">
      <DisclosureGroup
        defaultExpandedKeys={['selected', 'git', 'web']}
        allowsMultipleExpanded
      >
        <SelectedFilesPanel />
        <GitPanel />
        <WebDisclosurePanel />
      </DisclosureGroup>
    </section>
  )
}
