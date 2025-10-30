import { listSavedPages, SavedPages } from '@/api/web'
import { queue } from '@/components/toasts/toast-queue'
import { getErrorMessage } from '@/helpers/get-error-message'
import { convertFileSrc } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'

export async function fetchSavedPages(
  directoryPath: string
): Promise<SavedPages> {
  try {
    const [pages, appDataDirPath] = await Promise.all([
      listSavedPages(directoryPath),
      appDataDir(),
    ])

    const faviconPromises = pages
      .filter((page) => page.faviconPath)
      .map(async (page) => {
        const filePath = await join(appDataDirPath, page.faviconPath!)
        return { page, faviconPath: convertFileSrc(filePath) }
      })

    const convertedFavicons = await Promise.all(faviconPromises)
    for (const { page, faviconPath } of convertedFavicons) {
      page.faviconPath = faviconPath
    }

    return pages
  } catch (error) {
    const message = getErrorMessage(error)

    queue.add({
      title: 'Failed to load saved pages',
      description: message,
    })

    return []
  }
}
