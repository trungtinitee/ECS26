/**
 * ECS - Environmental Calculation System
 * Storage Manager (Dual-layer LocalStorage + IndexedDB)
 */

import { ProjectSnapshot } from '../types/ecs';

const PROJECTS_KEY = 'wwtc-next-projects-v1';
const LEGACY_KEY = 'wwtc-next-project';

export const makeId = (): string =>
  `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function readProjectsFromStorage(): ProjectSnapshot[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.projects)) return parsed.projects;
    }
  } catch (e) {
    console.warn('Error reading from localStorage:', e);
  }

  // Legacy fallback
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy);
      if (old && typeof old === 'object') {
        const migrated: ProjectSnapshot = {
          ...old,
          id: old.id || makeId(),
          updatedAt: old.updatedAt || old.savedAt || new Date().toISOString(),
        };
        return [migrated];
      }
    }
  } catch (e) {
    console.warn('Error reading legacy storage:', e);
  }

  return [];
}

export function writeProjectsToStorage(projects: ProjectSnapshot[]): boolean {
  try {
    const payload = {
      version: 2,
      projects,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(payload));
    syncToIndexedDB(projects).catch((err) =>
      console.warn('IndexedDB background sync warning:', err)
    );
    return true;
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
    return false;
  }
}

// IndexedDB Helper
function openEcsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB không khả dụng'));
    }
    const req = indexedDB.open('ECS_CALCULATION_DB', 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Không mở được IndexedDB'));
  });
}

export async function syncToIndexedDB(projects: ProjectSnapshot[]) {
  try {
    const db = await openEcsDB();
    const tx = db.transaction(['projects', 'meta'], 'readwrite');
    const store = tx.objectStore('projects');
    store.clear();
    projects.forEach((p) => store.put(p));
    tx.objectStore('meta').put({
      key: 'registry',
      version: 2,
      count: projects.length,
      syncedAt: new Date().toISOString(),
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB sync failed:', err);
  }
}

export function downloadJsonFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
