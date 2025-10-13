import { PropsWithChildren } from 'react'

export function EmptyPanelListMessage({ children }: PropsWithChildren) {
  return <div className="text-xs/loose text-solid-light">{children}</div>
}
