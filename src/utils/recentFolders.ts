import { load, Store } from "@tauri-apps/plugin-store";
import type { DirectoryInfo } from "../types/DirectoryInfo";

type RecentFoldersData = {
  entries: Record<string, DirectoryInfo>;
  order: string[];
};

export class RecentFolders {
  private static STORE_NAME = "store.json";
  private static KEY = "recent-opened";
  private static MAX_SIZE = 10;

  private static store: Awaited<Store> | null = null;

  private static async getStore() {
    if (!this.store) {
      this.store = await load(RecentFolders.STORE_NAME, { autoSave: false });
    }
    return this.store;
  }

  private static async getOrInitData(): Promise<{
    store: Awaited<Store>;
    data: RecentFoldersData;
  }> {
    const store = await this.getStore();
    let data = (await store.get<RecentFoldersData>(RecentFolders.KEY)) ?? null;

    if (!data) {
      data = { entries: {}, order: [] };
      await store.set(RecentFolders.KEY, data);
      await store.save();
    }

    return { store, data };
  }

  static async addRecentFolder(dir: DirectoryInfo): Promise<void> {
    const { store, data } = await this.getOrInitData();

    const key = this.makeKey(dir);

    const existingIndex = data.order.indexOf(key);
    if (existingIndex !== -1) {
      data.order.splice(existingIndex, 1);
    }

    data.entries[key] = dir;
    data.order.unshift(key);

    while (data.order.length > RecentFolders.MAX_SIZE) {
      const removed = data.order.pop();
      if (removed) {
        delete data.entries[removed];
      }
    }

    await store.set(RecentFolders.KEY, data);
    await store.save();
  }

  static async getRecentFolders(): Promise<DirectoryInfo[]> {
    const { data } = await this.getOrInitData();

    return data.order.map((k) => data.entries[k]).filter(Boolean);
  }

  static async clearRecentFolders(): Promise<void> {
    const store = await this.getStore();
    const data: RecentFoldersData = { entries: {}, order: [] };
    await store.set(RecentFolders.KEY, data);
    await store.save();
  }

  static async removeRecentFolder(path: string): Promise<void> {
    const { store, data } = await this.getOrInitData();

    const index = data.order.indexOf(path);
    if (index !== -1) {
      data.order.splice(index, 1);
      delete data.entries[path];
      await store.set(RecentFolders.KEY, data);
      await store.save();
    }
  }

  private static makeKey(dir: DirectoryInfo): string {
    return dir.path;
  }
}
