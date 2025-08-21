import { useEffect, useState } from "react";
import { type TreeNode, type FileSystemItem } from "../../types/FileTree";
import { invoke } from "@tauri-apps/api/core";
import { ERROR_CODES } from "../../constants";
import {
  Button,
  Checkbox,
  Collection,
  Key,
  Selection,
  Tree,
  TreeItem,
  TreeItemContent,
} from "react-aria-components";

import { SearchBar } from "./SearchBar";
import { SelectedFileInfo } from "./SelectedFileInfo";
import { ErrorBanner } from "../common/ErrorBanner";
import type { DirectoryInfo } from "../../types/DirectoryInfo";

interface SidebarProps {
  root: DirectoryInfo;
  onSelectedFilesChange?: (files: string[]) => void;
}

interface DirectoryError {
  code: number;
  directory_name?: string;
}

export function Sidebar({ root, onSelectedFilesChange }: SidebarProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(new Set());
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadRoot() {
      try {
        const entries = await invoke<TreeNode[]>("list_directory", {
          path: root.path,
        });

        setTree(entries);
      } catch (err) {
        const e = err as DirectoryError;
        if (e && e.code === ERROR_CODES.DIRECTORY_READ_ERROR) {
          setError(`Error reading directory ${e.directory_name ?? ""}`);
        }
      }
    }

    loadRoot();
  }, [root.path]);

  // Fixed collapse all function
  function collapseAll() {
    setExpandedKeys(new Set());
  }

  // Helper function to collect all keys from tree nodes recursively
  function collectAllKeys(nodes: TreeNode[]): Set<Key> {
    const keys = new Set<Key>();

    function traverse(items: TreeNode[]) {
      for (const item of items) {
        keys.add(item.id);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    }

    traverse(nodes);
    return keys;
  }

  // Helper function to collect all children keys from a specific node
  function collectChildrenKeys(nodes: TreeNode[], parentKey: string): Set<Key> {
    const keys = new Set<Key>();

    function findNode(items: TreeNode[], key: string): TreeNode | null {
      for (const item of items) {
        if (item.id === key) {
          return item;
        }
        if (item.children) {
          const found = findNode(item.children, key);
          if (found) return found;
        }
      }
      return null;
    }

    function traverse(items: TreeNode[]) {
      for (const item of items) {
        keys.add(item.id);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    }

    const parentNode = findNode(nodes, parentKey);
    if (parentNode && parentNode.children) {
      traverse(parentNode.children);
    }

    return keys;
  }

  async function runSearch(nextQuery?: string) {
    const term = nextQuery ?? query;
    const trimmedTerm = term.trim();

    const filteredTree = await invoke<TreeNode[]>("search_tree", {
      path: root.path,
      term: trimmedTerm,
    });

    setTree(filteredTree);

    if (trimmedTerm === "") {
      // Collapse all when search is empty
      setExpandedKeys(new Set());
    } else {
      // Expand all nodes when searching
      setExpandedKeys(collectAllKeys(filteredTree));
    }
  }

  function handleSelectionChange(keys: Selection) {
    if (keys === "all") {
      setSelectedKeys(keys);
      setSelectedFile(null);
      return;
    }

    const newKeys = keys instanceof Set ? keys : new Set();
    const oldKeys = selectedKeys instanceof Set ? selectedKeys : new Set();

    // Find newly selected and deselected keys
    const newlySelected = new Set(
      [...newKeys].filter((key) => !oldKeys.has(key)),
    );
    const newlyDeselected = new Set(
      [...oldKeys].filter((key) => !newKeys.has(key)),
    );
    const finalKeys = new Set(newKeys);

    // Helper to find node in tree
    function findNode(nodes: TreeNode[], searchKey: Key): TreeNode | null {
      for (const item of nodes) {
        if (item.id === searchKey) {
          return item;
        }
        if (item.children) {
          const found = findNode(item.children, searchKey);
          if (found) return found;
        }
      }
      return null;
    }

    // For each newly selected key, if it's a directory, select all its children
    for (const key of newlySelected) {
      const node = findNode(tree, key);
      if (node && node.type === "directory" && node.children) {
        const childrenKeys = collectChildrenKeys(tree, key.toString());
        childrenKeys.forEach((childKey) => finalKeys.add(childKey));
      }
    }

    // For each newly deselected key, if it's a directory, deselect all its children
    for (const key of newlyDeselected) {
      const node = findNode(tree, key);
      if (node && node.type === "directory" && node.children) {
        const childrenKeys = collectChildrenKeys(tree, key.toString());
        childrenKeys.forEach((childKey) => finalKeys.delete(childKey));
      }
    }

    setSelectedKeys(finalKeys);

    // Notify parent about selected files (files only, exclude directories)
    if (onSelectedFilesChange) {
      const filePaths: string[] = [];
      for (const key of finalKeys) {
        const node = findNode(tree, key);
        if (node && node.type === "file") {
          filePaths.push(key.toString());
        }
      }
      onSelectedFilesChange(filePaths);
    }

    // Update selected file for the info panel
    if (finalKeys.size === 1) {
      const selectedKey = Array.from(finalKeys)[0];
      setSelectedFile(selectedKey.toString());
    } else {
      setSelectedFile(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header: folder name & collapse all */}
      <div className="mb-2 flex items-center justify-between">
        {root.name && (
          <div className="text-sm font-semibold text-gray-900">{root.name}</div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={collapseAll}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            title="Collapse all"
          >
            <span aria-hidden className="text-base leading-none">
              ×
            </span>
            <span>Collapse all</span>
          </button>
        </div>
      </div>

      <SearchBar
        value={query}
        onChange={(value) => {
          setQuery(value);
          runSearch(value);
        }}
        onClear={() => {
          setQuery("");
          setSelectedFile(null);
          setSelectedKeys(new Set());
          runSearch("");
        }}
        disabled={!root.path}
      />

      {/* Error */}
      <ErrorBanner message={error} />

      {/* File Tree container */}
      <div className="mt-3 flex-1">
        <div className="h-full overflow-y-auto rounded-lg border border-gray-200 p-1">
          {tree.length > 0 ? (
            <Tree
              selectionBehavior="toggle"
              aria-label="directory tree"
              selectionMode="multiple"
              items={tree}
              className="w-full"
              expandedKeys={expandedKeys}
              onExpandedChange={setExpandedKeys}
              selectedKeys={selectedKeys}
              onSelectionChange={handleSelectionChange}
            >
              {function renderItem(item: FileSystemItem, depth: number = 0) {
                return (
                  <TreeItem
                    key={item.id}
                    id={item.id}
                    textValue={item.title}
                    className="cursor-pointer hover:bg-gray-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <TreeItemContent>
                      {({
                        hasChildItems,
                        isExpanded,
                        selectionMode,
                        selectionBehavior,
                      }) => (
                        <div
                          className="flex items-center space-x-2 py-1 px-2"
                          style={{ paddingLeft: `${8 + depth * 16}px` }}
                        >
                          {selectionBehavior === "toggle" &&
                            selectionMode !== "none" && (
                              <Checkbox
                                slot="selection"
                                aria-label="Select item"
                                className="flex-shrink-0"
                              >
                                {({ isSelected, isIndeterminate }) => {
                                  const selected =
                                    isSelected || isIndeterminate;
                                  return (
                                    <span
                                      className={`inline-flex h-4 w-4 items-center justify-center rounded border ${selected ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}
                                      aria-hidden="true"
                                    >
                                      {isIndeterminate ? (
                                        <span className="h-0.5 w-2 bg-white" />
                                      ) : isSelected ? (
                                        <svg
                                          viewBox="0 0 18 18"
                                          className="h-3 w-3"
                                          aria-hidden="true"
                                        >
                                          <polyline
                                            points="1 9 7 14 15 4"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2"
                                          />
                                        </svg>
                                      ) : null}
                                    </span>
                                  );
                                }}
                              </Checkbox>
                            )}

                          {hasChildItems ? (
                            <Button
                              slot="chevron"
                              className="shrink-0 w-4 h-4 flex items-center justify-center bg-transparent border-0 cursor-pointer focus:outline-none"
                            >
                              <span className="text-gray-400">
                                {isExpanded ? (
                                  <svg
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="size-4"
                                  >
                                    <path
                                      d="M4 6H11L7.5 10.5L4 6Z"
                                      fill="currentColor"
                                    ></path>
                                  </svg>
                                ) : (
                                  <svg
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="size-4"
                                  >
                                    <path
                                      d="M6 11L6 4L10.5 7.5L6 11Z"
                                      fill="currentColor"
                                    ></path>
                                  </svg>
                                )}
                              </span>
                            </Button>
                          ) : (
                            <div className="shrink-0 w-4 h-4" />
                          )}
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400 text-sm">
                              {item.type === "directory" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="size-5"
                                >
                                  <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="size-5"
                                >
                                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                                  <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                                </svg>
                              )}
                            </span>
                            <span className="text-sm text-gray-900">
                              {item.title}
                            </span>
                          </div>
                        </div>
                      )}
                    </TreeItemContent>
                    <Collection items={item.children}>
                      {(childItem: FileSystemItem) =>
                        renderItem(childItem, depth + 1)
                      }
                    </Collection>
                  </TreeItem>
                );
              }}
            </Tree>
          ) : (
            <div className="p-3">
              {/*<TreeStatus show={!error && tree.length === 0} />*/}
            </div>
          )}
        </div>
      </div>

      {/* Selected file helper (optional) */}
      <SelectedFileInfo path={selectedFile} />
    </div>
  );
}
