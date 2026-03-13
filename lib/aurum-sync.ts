// ─────────────────────────────────────────────
// Aurum Cloud Sync Service
// Syncs localStorage data to Supabase user_data table
// Bidirectional: local → cloud, cloud → local
// Uses user_data table with data_type + JSONB data
// ─────────────────────────────────────────────

import { supabase } from "./supabase";
import { loadData, saveData, type AurumData } from "./aurum-store";

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SYNC_KEY = "aurum_last_sync";
const DATA_TYPES = ["tasks", "habits", "projects", "reminders", "transactions", "notebooks"] as const;

type DataType = (typeof DATA_TYPES)[number];

let syncTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

// ── Get last sync timestamp ──
function getLastSync(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(SYNC_KEY) || "0", 10);
}

function setLastSync(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SYNC_KEY, Date.now().toString());
  }
}

// ── Push local data to cloud ──
async function pushToCloud(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !userId) return { success: false, error: "No auth" };

  const data = loadData();

  try {
    for (const dataType of DATA_TYPES) {
      const items = data[dataType] || [];

      // Upsert: check if row exists for this user + data_type
      const { data: existing } = await supabase
        .from("user_data")
        .select("id, updated_at")
        .eq("user_id", userId)
        .eq("data_type", dataType)
        .single();

      if (existing) {
        // Update existing row
        await supabase
          .from("user_data")
          .update({ data: items, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        // Insert new row
        await supabase
          .from("user_data")
          .insert({ user_id: userId, data_type: dataType, data: items });
      }
    }

    setLastSync();
    console.log("[Aurum Sync] Pushed to cloud successfully");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Aurum Sync] Push failed:", msg);
    return { success: false, error: msg };
  }
}

// ── Pull from cloud to local ──
async function pullFromCloud(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !userId) return { success: false, error: "No auth" };

  try {
    const { data: rows, error } = await supabase
      .from("user_data")
      .select("data_type, data, updated_at")
      .eq("user_id", userId);

    if (error) throw error;
    if (!rows || rows.length === 0) return { success: true }; // Nothing in cloud yet

    const localData = loadData();
    let updated = false;

    for (const row of rows) {
      const dt = row.data_type as DataType;
      if (!DATA_TYPES.includes(dt)) continue;

      const cloudItems = (row.data || []) as any[];
      const localItems = (localData[dt] || []) as any[];

      // Merge strategy: cloud items that don't exist locally get added
      // Items with same ID: keep the one with latest timestamp
      if (cloudItems.length > 0 && localItems.length === 0) {
        // Cloud has data, local is empty → use cloud data
        (localData as any)[dt] = cloudItems;
        updated = true;
      } else if (cloudItems.length > 0) {
        // Both have data → merge by ID
        const localMap = new Map(localItems.map((item: any) => [item.id, item]));
        for (const cloudItem of cloudItems) {
          const local = localMap.get(cloudItem.id);
          if (!local) {
            // New item from cloud
            localItems.push(cloudItem);
            updated = true;
          } else if (cloudItem.updatedAt && local.updatedAt && cloudItem.updatedAt > local.updatedAt) {
            // Cloud is newer
            Object.assign(local, cloudItem);
            updated = true;
          }
        }
      }
    }

    if (updated) {
      saveData(localData);
      console.log("[Aurum Sync] Pulled from cloud, local data updated");
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Aurum Sync] Pull failed:", msg);
    return { success: false, error: msg };
  }
}

// ── Full sync (pull then push) ──
export async function syncNow(userId: string): Promise<{ success: boolean; error?: string }> {
  if (isSyncing) return { success: false, error: "Already syncing" };
  isSyncing = true;

  try {
    // Pull first (get latest from cloud)
    const pullResult = await pullFromCloud(userId);
    if (!pullResult.success) {
      isSyncing = false;
      return pullResult;
    }

    // Then push (send local changes to cloud)
    const pushResult = await pushToCloud(userId);
    isSyncing = false;
    return pushResult;
  } catch (err) {
    isSyncing = false;
    return { success: false, error: err instanceof Error ? err.message : "Sync error" };
  }
}

// ── Start auto sync ──
export function startAutoSync(userId: string): void {
  if (syncTimer) return; // Already running

  // Initial sync after 3 seconds (let app load first)
  setTimeout(() => syncNow(userId), 3000);

  // Then sync every 5 minutes
  syncTimer = setInterval(() => syncNow(userId), SYNC_INTERVAL);
  console.log("[Aurum Sync] Auto sync started (every 5 min)");
}

// ── Stop auto sync ──
export function stopAutoSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log("[Aurum Sync] Auto sync stopped");
  }
}

// ── Get sync status ──
export function getSyncStatus(): { lastSync: number; isSyncing: boolean; autoSyncActive: boolean } {
  return {
    lastSync: getLastSync(),
    isSyncing,
    autoSyncActive: syncTimer !== null,
  };
}
