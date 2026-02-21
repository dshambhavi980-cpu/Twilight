import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { supabase } from '../lib/supabase';

export interface AppUpdateData {
  version_code: number;
  version_name: string;
  apk_url: string;
  force_update: boolean;
  message: string;
}

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState<AppUpdateData | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    checkUpdate();
  }, []);

  const checkUpdate = async () => {
    if (Capacitor.getPlatform() !== 'android') {
      setIsChecking(false);
      return;
    }

    try {
      // 1. Get current installed app version code
      const appInfo = await App.getInfo();
      const currentVersionCode = parseInt(appInfo.build || '1', 10);

      // 2. Fetch latest version from Supabase
      const { data, error } = await supabase
        .from('app_updates')
        .select('*')
        .order('version_code', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching update info:', error);
      }

      const updateData = data as any;
      if (updateData && updateData.version_code > currentVersionCode) {
        setUpdateAvailable(updateData as AppUpdateData);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const downloadAndInstall = async () => {
    if (!updateAvailable) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadError(null);

    const fileName = `twilight-garden-v${updateAvailable.version_name}.apk`;

    try {
      // 1. Download file using Capacitor Filesystem Plugin
      const downloadResult = await Filesystem.downloadFile({
        url: updateAvailable.apk_url,
        path: fileName,
        directory: Directory.Cache,
        progress: true,
      });

      // 2. Install the downloaded APK using FileOpener
      await FileOpener.openFile({
         path: downloadResult.path || '',
      });

      setIsDownloading(false);
    } catch (e: any) {
      console.error('Download/Install error:', e);
      setDownloadError(e.message || 'Failed to download or install update');
      setIsDownloading(false);
    }
  };

  // We need to listen to downloading progress if Capacitor supports it via listeners natively. 
  // Usually, `progress: true` emits an event we can capture. Let's wire that up.
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    const progressListener = Filesystem.addListener('progress', (progress) => {
        const loaded = progress.bytes;
        const total = progress.contentLength;
        if (total > 0) {
            setDownloadProgress(Math.round((loaded / total) * 100));
        }
    });

    return () => {
        progressListener.then(listener => listener.remove());
    };
  }, []);

  return {
    updateAvailable,
    isChecking,
    isDownloading,
    downloadProgress,
    downloadError,
    downloadAndInstall,
    dismissUpdate: () => setUpdateAvailable(null),
  };
}
