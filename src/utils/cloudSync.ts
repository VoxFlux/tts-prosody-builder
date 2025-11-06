import { supabase } from '../lib/supabase';
import { PersistedData, loadFromStorage, saveToStorage } from './persistence';

export interface SyncStatus {
  syncing: boolean;
  lastSynced: Date | null;
  error: string | null;
}

/**
 * Clean up duplicate rows, keeping only the most recent one
 */
const cleanupDuplicates = async (userId: string): Promise<void> => {
  try {
    // Get all rows for this user, ordered by most recent first
    const { data: allRows } = await supabase
      .from('user_data')
      .select('id, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (allRows && allRows.length > 1) {
      // Keep the first (most recent), delete the rest
      const idsToDelete = allRows.slice(1).map(row => row.id);

      await supabase
        .from('user_data')
        .delete()
        .in('id', idsToDelete);

      console.log(`Cleaned up ${idsToDelete.length} duplicate rows`);
    }
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
  }
};

/**
 * Sync local data to Supabase
 */
export const syncToCloud = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const localData = loadFromStorage();

    // Clean up any duplicate rows first
    await cleanupDuplicates(userId);

    // Check if record exists (should be only one now)
    const { data: existing } = await supabase
      .from('user_data')
      .select('id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let error;
    if (existing) {
      // Update existing record
      const result = await supabase
        .from('user_data')
        .update({
          data: localData,
          last_synced: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);  // Use ID instead of user_id for safety
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('user_data')
        .insert({
          user_id: userId,
          data: localData,
          last_synced: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      error = result.error;
    }

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Sync to cloud failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load data from Supabase
 */
export const syncFromCloud = async (userId: string): Promise<{ success: boolean; data?: PersistedData; error?: string }> => {
  try {
    // Clean up any duplicate rows first
    await cleanupDuplicates(userId);

    // Get most recent row
    const { data, error } = await supabase
      .from('user_data')
      .select('data, id, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    if (data) {
      return { success: true, data: data.data };
    }

    return { success: true, data: {} };
  } catch (error: any) {
    console.error('Sync from cloud failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Merge cloud and local data (cloud takes precedence if more recent)
 */
export const mergeData = (localData: PersistedData, cloudData: PersistedData): PersistedData => {
  const localTimestamp = localData.appSettings?.lastUpdated
    ? new Date(localData.appSettings.lastUpdated).getTime()
    : 0;

  const cloudTimestamp = cloudData.appSettings?.lastUpdated
    ? new Date(cloudData.appSettings.lastUpdated).getTime()
    : 0;

  // If cloud data is more recent, use it
  if (cloudTimestamp > localTimestamp) {
    return cloudData;
  }

  // Otherwise keep local data
  return localData;
};

/**
 * Full sync: load from cloud, merge with local, save back to cloud if needed
 */
export const fullSync = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Load local and cloud data
    const localData = loadFromStorage();
    const cloudResult = await syncFromCloud(userId);

    if (!cloudResult.success) {
      return { success: false, error: cloudResult.error };
    }

    const cloudData = cloudResult.data || {};

    // Merge data (prefer more recent)
    const mergedData = mergeData(localData, cloudData);

    // Save merged data locally
    saveToStorage(mergedData);

    // Sync back to cloud
    const syncResult = await syncToCloud(userId);

    return syncResult;
  } catch (error: any) {
    console.error('Full sync failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Auto-sync with debouncing
 */
let syncTimeout: NodeJS.Timeout | null = null;
export const createAutoSync = (userId: string | null, delay: number = 3000) => {
  return () => {
    if (!userId) return;

    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(() => {
      syncToCloud(userId);
    }, delay);
  };
};
