import { XIcon } from 'lucide-react'
import {
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as ToastRegion,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  Text,
  Button,
} from 'react-aria-components'

interface MyToastContent {
  title: string
  description?: string
}
export const queue = new ToastQueue<MyToastContent>()

export function Toaster() {
  return (
    <ToastRegion
      queue={queue}
      className="
        text-xs text-text-light
        fixed bottom-4 right-4
        flex flex-col-reverse gap-2
        rounded-lg outline-none
        [&[data-focus-visible]]:outline-2
        [&[data-focus-visible]]:outline-offset-2
        [&[data-focus-visible]]:outline-border-light
      "
    >
      {({ toast }) => (
        <Toast
          toast={toast}
          className="
            flex items-center gap-2.5
            bg-interactive-light
            py-2 px-3
            outline-none
            [&[data-focus-visible]]:outline-2
            [&[data-focus-visible]]:outline-offset-2
            [&[data-focus-visible]]:outline-border-light
          "
        >
          <ToastContent className="flex flex-col flex-auto min-w-0">
            <Text slot="title">{toast.content.title}</Text>
            <Text slot="description">{toast.content.description}</Text>
          </ToastContent>

          <Button
            slot="close"
            className="
              flex-none inline-flex items-center justify-center
              bg-transparent appearance-none p-0 outline-none
              cursor-pointer
              -mr-0.5
              [&[data-focus-visible]]:ring-2
              [&[data-focus-visible]]:ring-border-light
              [&[data-focus-visible]]:ring-offset-2
              [&[data-focus-visible]]:ring-offset-solid-light
              [&[data-pressed]]:bg-white/20"
          >
            <XIcon className="size-3" />
          </Button>
        </Toast>
      )}
    </ToastRegion>
  )
}
