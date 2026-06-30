import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { mediaService } from '@/lib/media-service';
import { toast } from 'sonner';

export function MediaSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    try {
      await mediaService.syncExistingImages();
      setSyncStatus('success');
      toast.success('Existing images synced successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      toast.error('Failed to sync existing images');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        syncStatus === 'success'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : syncStatus === 'error'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
      }`}
    >
      {syncing ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Syncing...
        </>
      ) : syncStatus === 'success' ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Synced
        </>
      ) : syncStatus === 'error' ? (
        <>
          <AlertCircle className="w-4 h-4" />
          Sync Failed
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          Sync Existing Images
        </>
      )}
    </button>
  );
}