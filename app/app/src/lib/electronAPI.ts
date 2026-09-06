import type { Conf, ConfContainer, Settings, WindowPosition } from './Conf';

const electronAPI =
  typeof window === 'object'
    ? (
        window as unknown as {
          electronAPI: {
            requestConfigFile(): void;
            requestHelp(): void;
            configFile(
              callback: (event: any, data: ConfContainer) => void,
            ): void;
            requestSave(data: {
              config: Conf[];
              filename: string;
              uid: string;
            }): void;
            requestSaveAs(data: { config: Conf[]; uid: string }): void;
            requestLaunch(data: {
              config: Conf[];
              mode: 'normal' | 'clickable';
              uid: string;
              indexes: number[];
            }): void;
            saved(
              callback: (
                event: any,
                data: { filename: string; basename: string; uid: string },
              ) => void,
            ): void;
            settings(callback: (event: any, data: Settings) => void): void;
            windowPosition(
              callback: (event: any, data: WindowPosition) => void,
            ): void;
            requestSettings(): void;
            requestCloseAll(): void;
            requestRestoreFiles(): void;
            restored(callback: (event: any) => void): void;
            requestSetOpenFiles(data: { filenames: string[] }): void;
            overlays(
              callback: (event: any, data: { count: number }) => void,
            ): void;
            requestSetDefaultConfig(data: { filename: string | null }): void;
          };
        }
      ).electronAPI
    : {
        requestConfigFile() {},
        requestHelp() {},
        configFile(_callback: (event: any, data: ConfContainer) => void) {},
        requestSave(_data: {
          config: Conf[];
          filename: string;
          uid: string;
        }) {},
        requestSaveAs(_data: { config: Conf[]; uid: string }) {},
        requestLaunch(_data: {
          config: Conf[];
          mode: 'normal' | 'clickable';
          uid: string;
          indexes: number[];
        }) {},
        saved(
          _callback: (
            event: any,
            data: { filename: string; basename: string; uid: string },
          ) => void,
        ) {},
        settings(_callback: (event: any, data: Settings) => void) {},
        windowPosition(
          _callback: (event: any, data: WindowPosition) => void,
        ) {},
        requestSettings() {},
        requestCloseAll() {},
        requestRestoreFiles() {},
        restored(_callback: (event: any) => void) {},
        requestSetOpenFiles(_data: { filenames: string[] }) {},
        overlays(_callback: (event: any, data: { count: number }) => void) {},
        requestSetDefaultConfig(_data: { filename: string | null }) {},
      };

export default electronAPI;
