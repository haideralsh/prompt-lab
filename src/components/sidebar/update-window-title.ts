import { getCurrentWindow } from '@tauri-apps/api/window'
import { queue } from '@/components/toasts/toast-queue'

export async function updateWindowTitle(title: string) {
  try {
    await getCurrentWindow().setTitle(title)
  } catch (error) {
    queue.add({
      title: 'Failed to set window title.',
    })
  }
}

export async function resetWindowTitle() {
  await updateWindowTitle('PromptLab')
}
