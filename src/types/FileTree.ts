export interface TreeNode {
  id: string;
  title: string;
  type: "directory" | "file";
  children: TreeNode[];
}

export interface FileSystemItem {
  id: string;
  title: string;
  type: "directory" | "file";
  children: FileSystemItem[];
}

export interface SearchMatch {
  matchedIdsCount: number;
  results: TreeNode[];
}
