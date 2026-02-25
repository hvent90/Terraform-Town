import { watch, type FSWatcher } from 'fs';
import { readStateFile } from './state-reader';
import type { TerraformState } from '@terraform-town/visualization/src/types';

export function watchStateFile(
  path: string,
  onChange: (state: TerraformState) => void,
): FSWatcher {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const watcher = watch(path, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const state = readStateFile(path);
      onChange(state);
    }, 100);
  });

  return watcher;
}
