import { useEffect } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

export const useAutoUpdater = () => {
  useEffect(() => {
    const checkForUpdates = async () => {
      if (!isTauri()) return;

      try {
        const update = await check();
        
        if (update) {
          console.log(`Update available: ${update.version}`);
          console.log(`Release notes: ${update.body}`);
          
          await message(
            `A new version (${update.version}) of Twilight Garden is available! Click OK to download and install.`, 
            { title: 'Update Available', kind: 'info' }
          );

          let downloaded = 0;
          let contentLength = 0;

          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength || 0;
                console.log(`started downloading ${event.data.contentLength} bytes`);
                break;
              case 'Progress':
                downloaded += event.data.chunkLength;
                console.log(`downloaded ${downloaded} from ${contentLength}`);
                break;
              case 'Finished':
                console.log('download finished');
                break;
            }
          });

          console.log('Update installed');
          
          // Since we might not have process plugin installed yet, we'll try window.location.reload 
          // but usually Tauri restarts on 'Finished' or requires relaunch.
          // Let's use a simple alert tell the user to restart if relaunch fails.
          try {
             // If they don't have the process plugin, we'll prompt manually
             await message('The update was installed successfully. The application will now restart.', { title: 'Update Installed', kind: 'info' });
             await relaunch();
          } catch (e) {
             window.location.reload();
          }
        } else {
            console.log("No updates available.");
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    };

    checkForUpdates();
  }, []);
};
