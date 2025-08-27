import { useEffect, useState } from "react";
import { type TreeNode, type FileSystemItem, type SearchMatch } from "../../types/FileTree";
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
  const [indeterminateKeys, setIndeterminateKeys] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadRoot() {
      try {
        const resp = await invoke<SearchMatch>("search_tree", {
          path: root.path,
          term: "",
        });

        setTree(resp.results);
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

  // Helper to find node in tree
  function findNode(nodes: TreeNode[], searchKey: string): TreeNode | null {
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

  // Helper to find parent of a node
  function findParent(nodes: TreeNode[], childKey: string): TreeNode | null {
    for (const item of nodes) {
      if (item.children) {
        if (item.children.some(child => child.id === childKey)) {
          return item;
        }
        const found = findParent(item.children, childKey);
        if (found) return found;
      }
    }
    return null;
  }

  // Get all descendants of a node
  function getAllDescendants(node: TreeNode): string[] {
    const descendants: string[] = [];
    
    function traverse(item: TreeNode) {
      descendants.push(item.id);
      if (item.children) {
        item.children.forEach(traverse);
      }
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
    
    return descendants;
  }

  // Get all ancestors of a node
  function getAllAncestors(nodes: TreeNode[], nodeKey: string): string[] {
    const ancestors: string[] = [];
    let current = nodeKey;
    
    while (current) {
      const parent = findParent(nodes, current);
      if (parent) {
        ancestors.push(parent.id);
        current = parent.id;
      } else {
        break;
      }
    }
    
    return ancestors;
  }

  // Calculate selection state for a directory
  function getDirectorySelectionState(node: TreeNode, selectedKeys: Set<string>): 'none' | 'partial' | 'full' {
    if (!node.children || node.children.length === 0) {
      return 'none';
    }
    
    let selectedCount = 0;
    let totalCount = 0;
    
    function countSelection(item: TreeNode) {
      totalCount++;
      if (selectedKeys.has(item.id)) {
        selectedCount++;
      }
      if (item.children) {
        item.children.forEach(countSelection);
      }
    }
    
    node.children.forEach(countSelection);
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === totalCount) return 'full';
    return 'partial';
  }

  function updateIndeterminateStates(selectedKeys: Set<string>) {
    const newIndeterminateKeys = new Set<string>();
    
    function processNode(node: TreeNode) {
      if (node.type === 'directory') {
        const state = getDirectorySelectionState(node, selectedKeys);
        if (state === 'partial') {
          newIndeterminateKeys.add(node.id);
        }
      }
      
      if (node.children) {
        node.children.forEach(processNode);
      }
    }
    
    tree.forEach(processNode);
    setIndeterminateKeys(newIndeterminateKeys);
  }

  async function runSearch(nextQuery?: string) {
    const term = nextQuery ?? query;
    const trimmedTerm = term.trim();

    const resp = await invoke<SearchMatch>("search_tree", {
      path: root.path,
      term: trimmedTerm,
    });

    const nextTree = resp.results;
    setTree(nextTree);

    if (trimmedTerm === "") {
      // Collapse all when search is empty
      setExpandedKeys(new Set());
    } else {
      // Expand all nodes when searching
      setExpandedKeys(collectAllKeys(nextTree));
    }
  }

  function handleSelectionChange(keys: Selection) {
    if (keys === "all") {
      setSelectedKeys(keys);
      setSelectedFile(null);
      return;
    }

    const newKeys = keys instanceof Set ? keys : new Set<Key>();
    const oldKeys = selectedKeys instanceof Set ? selectedKeys : new Set<Key>();

    // Find the difference to determine what changed
    const newlySelected = [...newKeys].filter(key => !oldKeys.has(key));
    const newlyDeselected = [...oldKeys].filter(key => !newKeys.has(key));
    
    // Start with current selection as string set for easier manipulation
    const finalKeys = new Set<string>();
    oldKeys.forEach(key => finalKeys.add(key.toString()));
    
    // Process newly selected items
    for (const key of newlySelected) {
      const keyStr = key.toString();
      const node = findNode(tree, keyStr);
      
      if (node) {
        finalKeys.add(keyStr);
        
        // If it's a directory, select all descendants
        if (node.type === "directory") {
          const descendants = getAllDescendants(node);
          descendants.forEach(desc => finalKeys.add(desc));
        }
      }
    }
    
    for (const key of newlyDeselected) {
      const keyStr = key.toString();
      const node = findNode(tree, keyStr);
      
      if (node) {
        finalKeys.delete(keyStr);
        
        // If it's a directory, deselect all descendants
        if (node.type === "directory") {
          const descendants = getAllDescendants(node);
          descendants.forEach(desc => finalKeys.delete(desc));
        }
      }
    }
    
    // Now handle parent-child relationships
    // For each changed item, update its ancestors
    const allChangedItems = [...newlySelected, ...newlyDeselected];
    const ancestorsToCheck = new Set<string>();
    
    for (const key of allChangedItems) {
      const keyStr = key.toString();
      const ancestors = getAllAncestors(tree, keyStr);
      ancestors.forEach(ancestor => ancestorsToCheck.add(ancestor));
    }
    
    // Process ancestors to determine if they should be selected/deselected
    for (const ancestorKey of ancestorsToCheck) {
      const ancestorNode = findNode(tree, ancestorKey);
      if (ancestorNode && ancestorNode.type === "directory") {
        const state = getDirectorySelectionState(ancestorNode, finalKeys);
        
        if (state === 'full') {
          // All children are selected, so select the parent
          finalKeys.add(ancestorKey);
        } else if (state === 'none') {
          // No children are selected, so deselect the parent
          finalKeys.delete(ancestorKey);
        } else {
          // Some children are selected (partial), so deselect the parent
          // The indeterminate state will be handled separately
          finalKeys.delete(ancestorKey);
        }
      }
    }
    
    // Convert back to Selection format
    const finalSelection = new Set<Key>();
    finalKeys.forEach(key => finalSelection.add(key));
    
    setSelectedKeys(finalSelection);
    updateIndeterminateStates(finalKeys);

    // Notify parent about selected files (files only, exclude directories)
    if (onSelectedFilesChange) {
      const filePaths: string[] = [];
      for (const key of finalKeys) {
        const node = findNode(tree, key);
        if (node && node.type === "file") {
          filePaths.push(node.id);
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
          setIndeterminateKeys(new Set());
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
                                  // Override indeterminate state with our custom logic
                                  const customIndeterminate = indeterminateKeys.has(item.id);
                                  const customSelected = isSelected && !customIndeterminate;
                                  const hasState = customSelected || customIndeterminate;
                                  
                                  return (
                                    <span
                                      className={`inline-flex h-4 w-4 items-center justify-center rounded border ${hasState ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}
                                      aria-hidden="true"
                                    >
                                      {isIndeterminate ? (
<svg width="15" height="15" color="white" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.25 7.5C2.25 7.22386 2.47386 7 2.75 7H12.25C12.5261 7 12.75 7.22386 12.75 7.5C12.75 7.77614 12.5261 8 12.25 8H2.75C2.47386 8 2.25 7.77614 2.25 7.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                                      ) : customSelected ? (
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
