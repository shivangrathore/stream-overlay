import path from 'path';
import fs from 'fs';
import https from 'https';
import { spawn } from 'child_process';
import { program, Option } from 'commander';
import {
  app,
  session,
  dialog,
  ipcMain,
  screen,
  shell,
  BrowserWindow,
  Menu,
  Tray,
  BaseWindow,
  WebContentsView,
} from 'electron';
import type { MenuItemConstructorOptions, MenuItem } from 'electron';

// Needed until https://github.com/electron/electron/issues/46538 is fixed.
app.commandLine.appendSwitch('gtk-version', '3');

// Wayland doesn't let a window know or choose where it is on screen, which is
// the whole point of an overlay, so start over on XWayland instead. The ozone
// platform is picked before this file runs, so the only way to change it is to
// start again with the environment variable set. Set STREAM_OVERLAY_WAYLAND=1
// to opt out and stay on Wayland.
if (
  process.platform === 'linux' &&
  process.env.XDG_SESSION_TYPE === 'wayland' &&
  process.env.DISPLAY &&
  process.env.ELECTRON_OZONE_PLATFORM_HINT !== 'x11' &&
  !process.env.STREAM_OVERLAY_WAYLAND
) {
  spawn(process.execPath, process.argv.slice(1), {
    detached: true,
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_OZONE_PLATFORM_HINT: 'x11' },
  }).unref();
  app.exit(0);
}

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'package.json')).toString(),
);

const DEV = process.env.NODE_ENV !== 'production';
const DEFAULT_TITLE = 'Stream Overlay';
const DEFAULT_DISPLAY = 0;
const DEFAULT_WIDTH = 550;
const DEFAULT_HEIGHT = 650;
const DEFAULT_X = 0;
const DEFAULT_Y = 0;
const DEFAULT_X_ALIGN: XAlign = 'center';
const DEFAULT_Y_ALIGN: YAlign = 'center';
const DEFAULT_COVER_TASKBAR = false;
const DEFAULT_OPACITY = 1;
const DEFAULT_FULLSCREEN = false;
const DEFAULT_SCALE = 1;
const HANDLE_HEIGHT = 30;

type XAlign = 'left' | 'center' | 'right';
type YAlign = 'top' | 'center' | 'bottom';

type Conf = {
  url: string;
  title?: string;
  display?: number;
  width?: number | string;
  height?: number | string;
  x?: number | string;
  y?: number | string;
  xAlign?: XAlign;
  yAlign?: YAlign;
  opacity?: number;
  fullscreen?: boolean;
  coverTaskbar?: boolean;
  scale?: number;
};

const X_ALIGNS: XAlign[] = ['left', 'center', 'right'];
const Y_ALIGNS: YAlign[] = ['top', 'center', 'bottom'];

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'Print the current version');

program
  .option(
    '-u, --url <url>',
    'The URL of the page to open. This takes precedence over the passed config file',
    './help.html',
  )
  .option('-t, --title <title>', 'Window title', DEFAULT_TITLE)
  .addOption(
    new Option('-d, --display <display>', 'Which display (0 for primary)')
      .default(DEFAULT_DISPLAY, 'primary monitor')
      .argParser(parseFloat),
  )
  .addOption(
    new Option(
      '-f, --fullscreen',
      'Make the window full screen (x, y, width, and height are ignored)',
    ).default(DEFAULT_FULLSCREEN),
  )
  .addOption(
    new Option(
      '-c, --cover-taskbar',
      'Allow the window over the taskbar/panels (use the whole display instead of the work area)',
    ).default(DEFAULT_COVER_TASKBAR),
  )
  .addOption(
    new Option(
      '-X, --x-align <x_align>',
      'Horizontal edge that x is measured from',
    )
      .choices(X_ALIGNS)
      .default(DEFAULT_X_ALIGN),
  )
  .addOption(
    new Option(
      '-Y, --y-align <y_align>',
      'Vertical edge that y is measured from',
    )
      .choices(Y_ALIGNS)
      .default(DEFAULT_Y_ALIGN),
  )
  .addOption(
    new Option(
      '-x <x_coord>',
      'Window X offset from the horizontal alignment edge (-1 for centered)',
    )
      .default(DEFAULT_X, '0')
      .argParser(parseFloat),
  )
  .addOption(
    new Option(
      '-y <y_coord>',
      'Window Y offset from the vertical alignment edge (-1 for centered)',
    )
      .default(DEFAULT_Y, '0')
      .argParser(parseFloat),
  )
  .addOption(
    new Option('-w, --width <width>', 'Window width')
      .default(DEFAULT_WIDTH)
      .argParser(parseFloat),
  )
  .addOption(
    new Option('-h, --height <height>', 'Window height')
      .default(DEFAULT_HEIGHT)
      .argParser(parseFloat),
  )
  .addOption(
    new Option('-s, --scale <scale>', 'Scale factor (1 = 100%)')
      .default(DEFAULT_SCALE)
      .argParser(parseFloat),
  )
  .addOption(
    new Option(
      '-o, --opacity <opacity>',
      "Window opacity (0 transparent to 1 opaque) (doesn't work on Linux)",
    )
      .default(DEFAULT_OPACITY)
      .argParser(parseFloat),
  )
  .argument(
    '[configfile]',
    'The path to a config file',
    path.resolve(__dirname, '..', 'config.json'),
  );

let configured = false;
program.on('option:url', () => (configured = true));
program.parse();
const configFile = program.args.length
  ? path.resolve(program.args[0])
  : path.resolve(__dirname, '..', 'config.json');
const options = program.opts();
const {
  title,
  url,
  display,
  fullscreen,
  coverTaskbar,
  x,
  y,
  xAlign,
  yAlign,
  width,
  height,
  scale,
  opacity,
} = options;

type Settings = {
  defaultConfigFile?: string;
};

// User settings, stored next to the app's user data.
let settings: Settings = {};

const getSettingsFile = () =>
  path.join(app.getPath('userData'), 'settings.json');

const readSettings = () => {
  try {
    settings = JSON.parse(fs.readFileSync(getSettingsFile()).toString());
  } catch (e: any) {
    settings = {};
  }
};

const writeSettings = () => {
  try {
    fs.mkdirSync(path.dirname(getSettingsFile()), { recursive: true });
    fs.writeFileSync(getSettingsFile(), JSON.stringify(settings, null, 2));
  } catch (e: any) {
    dialog.showErrorBox("Can't save settings.", e.message);
  }
};

const getDefaultConfigFile = () =>
  settings.defaultConfigFile && fs.existsSync(settings.defaultConfigFile)
    ? settings.defaultConfigFile
    : undefined;

const sendSettings = () => {
  configEditorWindow?.webContents.send('settings', settings);
};

// All the open overlay windows.
const wins: {
  conf: Conf;
  win: BaseWindow;
  handleView: WebContentsView;
  webView: WebContentsView;
}[] = [];
// Config editor window.
let configEditorWindow: BrowserWindow | undefined;
// Help window.
let helpWindow: BrowserWindow | undefined;

ipcMain.handle('requestConfig', (event) => {
  const entry = wins.find(
    (entry) => event.sender === entry.handleView.webContents,
  );
  if (entry) {
    const { conf } = entry;
    event.sender.send('config', conf);
  }
});
ipcMain.handle('requestClose', (event) => {
  // Overlay windows are BaseWindows, so they aren't found by
  // BrowserWindow.fromWebContents.
  const entry = wins.find(
    (entry) => event.sender === entry.handleView.webContents,
  );
  if (entry) {
    entry.win.close();
    return;
  }
  BrowserWindow.fromWebContents(event.sender)?.close();
});
ipcMain.handle('requestFocusEvent', (event) => {
  const entry = wins.find(
    (entry) => event.sender === entry.handleView.webContents,
  );
  const win = entry?.win ?? BrowserWindow.fromWebContents(event.sender);
  if (win?.isFocused()) {
    event.sender.send('focus');
  }
});
ipcMain.handle('requestConfigFile', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    dialog
      .showOpenDialog(win, {
        title: 'Open Config File',
        properties: ['openFile'],
        filters: [
          {
            name: 'Stream Overlay Config',
            extensions: ['streamoverlay'],
          },
          { name: 'All Files', extensions: ['*'] },
        ],
      })
      .then((result) => {
        if (!result.canceled) {
          try {
            const filename = result.filePaths[0];
            const basename = path.basename(filename);
            const json = fs.readFileSync(result.filePaths[0]).toString();
            const config = JSON.parse(json);

            event.sender.send('configFile', { filename, basename, config });
          } catch (e: any) {
            dialog.showErrorBox("Can't open config file.", e.message);
          }
        }
      })
      .catch((err) => {
        dialog.showErrorBox('Error opening file.', `${err}`);
      });
  }
});
ipcMain.handle('requestSettings', (event) => {
  event.sender.send('settings', settings);
});
ipcMain.handle('requestSetDefaultConfig', (_event, { filename }) => {
  if (filename) {
    settings.defaultConfigFile = filename;
  } else {
    delete settings.defaultConfigFile;
  }
  writeSettings();
  sendSettings();
});
ipcMain.handle('requestHelp', (_event) => {
  createHelpWindow();
});
ipcMain.handle('requestLaunch', (_event, { config, mode, uid, indexes }) => {
  config.forEach((entry: Conf, i: number) => {
    const index = indexes?.[i];
    // Remember where this window came from, so moving it can update the editor.
    const source =
      uid && index != null ? { uid, index: index as number } : undefined;
    createOverlayWindow(entry, mode === 'clickable', source);
  });
});
ipcMain.handle('requestSave', (event, { config, filename, uid }) => {
  fs.writeFileSync(filename, JSON.stringify(config, null, 2));
  const basename = path.basename(filename);
  event.sender.send('saved', { filename, basename, uid });
});
ipcMain.handle('requestSaveAs', (event, { config, uid }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    dialog
      .showSaveDialog(win, {
        title: 'Save Config File',
        properties: ['showOverwriteConfirmation'],
        defaultPath: 'Untitled.streamoverlay',
        filters: [
          {
            name: 'Stream Overlay Config',
            extensions: ['streamoverlay'],
          },
          { name: 'All Files', extensions: ['*'] },
        ],
      })
      .then((result) => {
        if (!result.canceled) {
          try {
            const filename = result.filePath;
            if (filename == null) {
              return;
            }
            fs.writeFileSync(filename, JSON.stringify(config, null, 2));
            const basename = path.basename(filename);
            event.sender.send('saved', { filename, basename, uid });
          } catch (e: any) {
            dialog.showErrorBox("Can't save config file.", e.message);
          }
        }
      })
      .catch((err) => {
        dialog.showErrorBox('Error saving file.', `${err}`);
      });
  }
});

const createOverlayWindow = (
  conf: Conf,
  interactable = false,
  source?: { uid: string; index: number },
) => {
  let {
    display = DEFAULT_DISPLAY,
    x = DEFAULT_X,
    y = DEFAULT_Y,
    xAlign,
    yAlign,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    title = DEFAULT_TITLE,
    opacity = DEFAULT_OPACITY,
    fullscreen = DEFAULT_FULLSCREEN,
    coverTaskbar = DEFAULT_COVER_TASKBAR,
    scale = DEFAULT_SCALE,
  } = conf;

  // A legacy config uses -1 to mean centered on that axis.
  if (xAlign == null) {
    xAlign = x === -1 ? 'center' : 'left';
  }
  if (yAlign == null) {
    yAlign = y === -1 ? 'center' : 'top';
  }
  if (x === -1) {
    x = 0;
  }
  if (y === -1) {
    y = 0;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const displays = screen.getAllDisplays();
  const selectedDisplay =
    (display === 0 ? primaryDisplay : displays[display - 1]) ?? primaryDisplay;

  // The work area leaves room for taskbars and panels, the bounds don't.
  const area = coverTaskbar ? selectedDisplay.bounds : selectedDisplay.workArea;
  const { width: displayWidth, height: displayHeight } = area;

  const getPercent = (str: string) => {
    if (!str.match(/^-?\d+(?:\.\d+)?%$/)) {
      throw new Error('Invalid string.');
    }
    return parseFloat(str) / 100;
  };

  const getLength = (value: number | string, total: number) =>
    typeof value === 'string' ? getPercent(value) * total : value;

  try {
    if (typeof width === 'string') {
      width = getPercent(width) * displayWidth;
    }
    if (typeof height === 'string') {
      height = getPercent(height) * displayHeight;
    }
  } catch (e: any) {
    dialog.showErrorBox('Invalid Config', e.message);
    return;
  }

  if (!fullscreen && (width < 45 || height < 30)) {
    dialog.showErrorBox(
      'Invalid Config',
      "You're trying to make the window too small. Min width is 45 and min height is 30.",
    );
    return;
  }

  // The offset is measured from the aligned edge, so it always moves the
  // window toward the middle of the display.
  const align = (
    offset: number | string,
    alignment: XAlign | YAlign,
    size: number,
    total: number,
  ) => {
    const length = getLength(offset, total);
    switch (alignment) {
      case 'center':
        return Math.max(0, Math.floor(total / 2 - size / 2 + length));
      case 'right':
      case 'bottom':
        return Math.floor(total - size - length);
      default:
        return Math.floor(length);
    }
  };

  try {
    const newX = align(x, xAlign, width, displayWidth);
    const newY = align(y, yAlign, height, displayHeight);
    x = newX;
    y = newY;
  } catch (e: any) {
    dialog.showErrorBox('Invalid Config', e.message);
    return;
  }

  let win = new BaseWindow({
    // Tiling window managers respect this and leave the overlay floating,
    // instead of tiling it and throwing away its position and size.
    ...(process.platform === 'linux' ? { type: 'toolbar' as const } : {}),
    maximizable: false,
    resizable: true,
    minWidth: 45,
    minHeight: 30,
    alwaysOnTop: !interactable,
    title,
    icon: path.join(__dirname, '..', 'assets', 'logo.png'),
    width,
    height,
    x: area.x + x,
    y: area.y + y,
    transparent: true,
    frame: false,
    movable: true,
    skipTaskbar: true,
    opacity,
    fullscreen,
  });
  win.setBackgroundColor('rgba(0, 0, 0, 0.0)');

  const handleView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, '..', 'assets', 'preload.js'),
    },
  });
  win.contentView.addChildView(handleView);
  handleView.webContents.loadFile(
    path.join(__dirname, '..', 'assets', 'page.html'),
  );
  handleView.setBackgroundColor('rgba(0, 0, 0, 0.0)');
  handleView.setVisible(false);

  const webView = new WebContentsView({
    webPreferences: {
      sandbox: true,
      backgroundThrottling: false,
      safeDialogs: true,
      disableHtmlFullscreenWindowResize: true,
      zoomFactor: scale,
    },
  });
  win.contentView.addChildView(webView);
  webView.webContents.on('did-finish-load', () => {
    // Required for changes of zoomFactor. See https://stackoverflow.com/a/44196987
    webView.webContents.setZoomFactor(scale);
  });
  webView.webContents.loadURL(conf.url);
  webView.setBackgroundColor('rgba(0, 0, 0, 0.0)');

  // The views follow the window, so it can be resized.
  let focused = false;
  const layoutViews = () => {
    if (win.isDestroyed()) {
      return;
    }

    const [contentWidth, contentHeight] = win.getContentSize();
    const handleHeight = focused ? HANDLE_HEIGHT : 0;

    handleView.setBounds({
      x: 0,
      y: 0,
      width: contentWidth,
      height: handleHeight,
    });
    webView.setBounds({
      x: 0,
      y: handleHeight,
      width: contentWidth,
      height: Math.max(0, contentHeight - handleHeight),
    });
  };
  layoutViews();
  win.on('resize', layoutViews);

  // Report the window's position and size back to the config editor as it's
  // moved and resized, so the user can save where they've put it.
  let reportTimer: ReturnType<typeof setTimeout> | undefined;
  const reportBounds = () => {
    if (!source || fullscreen || win.isDestroyed()) {
      return;
    }

    const bounds = win.getBounds();
    const allDisplays = screen.getAllDisplays();
    const currentDisplay = screen.getDisplayMatching(bounds);
    const currentIndex = allDisplays.findIndex(
      (entry) => entry.id === currentDisplay.id,
    );
    const currentArea = coverTaskbar
      ? currentDisplay.bounds
      : currentDisplay.workArea;

    // Keep the units the user chose, and measure from the edge they aligned
    // the window to.
    const getOffset = (
      position: number,
      size: number,
      areaStart: number,
      areaSize: number,
      alignment: XAlign | YAlign,
      original: number | string | undefined,
    ) => {
      let offset: number;
      switch (alignment) {
        case 'center':
          offset = position - areaStart - (areaSize / 2 - size / 2);
          break;
        case 'right':
        case 'bottom':
          offset = areaStart + areaSize - (position + size);
          break;
        default:
          offset = position - areaStart;
      }

      if (typeof original === 'string') {
        return `${Math.round((offset / areaSize) * 10000) / 100}%`;
      }
      return Math.round(offset);
    };

    const getSize = (
      size: number,
      areaSize: number,
      original: number | string | undefined,
    ) =>
      typeof original === 'string'
        ? `${Math.round((size / areaSize) * 10000) / 100}%`
        : Math.round(size);

    configEditorWindow?.webContents.send('windowPosition', {
      uid: source.uid,
      index: source.index,
      position: {
        display:
          currentDisplay.id === screen.getPrimaryDisplay().id
            ? 0
            : currentIndex + 1,
        x: getOffset(
          bounds.x,
          bounds.width,
          currentArea.x,
          currentArea.width,
          xAlign,
          conf.x,
        ),
        y: getOffset(
          bounds.y,
          bounds.height,
          currentArea.y,
          currentArea.height,
          yAlign,
          conf.y,
        ),
        width: getSize(bounds.width, currentArea.width, conf.width),
        height: getSize(bounds.height, currentArea.height, conf.height),
      },
    });
  };

  if (source) {
    const scheduleReport = () => {
      clearTimeout(reportTimer);
      reportTimer = setTimeout(reportBounds, 250);
    };
    win.on('move', scheduleReport);
    win.on('resize', scheduleReport);
  }

  const timer = setInterval(() => win.moveTop(), 1000);

  // Emitted when the window is closed.
  win.on('closed', () => {
    handleView.webContents.close();
    webView.webContents.close();

    clearInterval(timer);
    clearTimeout(reportTimer);

    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    const i = wins.findIndex((entry) => entry.win === win);
    if (i > -1) {
      wins.splice(i, 1);
      makeTray();
    }

    // This is necessary until this is fixed: https://github.com/electron/electron/issues/46882
    app.emit('browser-window-blur');
  });

  const focus = () => {
    win.setIgnoreMouseEvents(false);
    win.setBackgroundColor('#ddd');

    focused = true;
    handleView.setVisible(true);
    layoutViews();
  };
  win.on('focus', focus);

  const blur = () => {
    if (!interactable) {
      win.setIgnoreMouseEvents(true);
    }
    win.setBackgroundColor('rgba(0, 0, 0, 0.0)');

    focused = false;
    handleView.setVisible(false);
    layoutViews();
  };
  win.on('blur', () => {
    blur();

    // This is necessary until this is fixed: https://github.com/electron/electron/issues/46882
    app.emit('browser-window-blur');
  });

  // Until it's focused, the window is transparent and click-through. Without
  // this it would stay opaque and swallow clicks until its first blur.
  if (win.isFocused()) {
    focus();
  } else {
    blur();
  }

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  if (!interactable) {
    win.setAlwaysOnTop(true, 'screen-saver', 1);
  }
  // win.webContents.openDevTools();

  wins.push({ win, conf, handleView, webView });
  makeTray();
};

const createConfigEditorWindow = () => {
  if (configEditorWindow) {
    configEditorWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: displayWidth, height: displayHeight } =
    primaryDisplay.workAreaSize;

  configEditorWindow = new BrowserWindow({
    webPreferences: {
      partition: 'persist:settings',
      preload: path.join(__dirname, '..', 'assets', 'preload.js'),
    },
    title: 'Config Editor',
    icon: path.join(__dirname, '..', 'assets', 'logo.png'),
    width: Math.min(displayWidth * 0.8, 1024),
    height: Math.min(displayHeight * 0.8, 768),
    autoHideMenuBar: true,
  });

  // configEditorWindow.loadURL('http://localhost:3000');
  configEditorWindow.loadFile('/app/build/index.html');

  configEditorWindow.webContents.on('did-finish-load', () => {
    sendSettings();

    // Open the startup config file so it's ready to edit.
    const filename = getDefaultConfigFile();
    if (filename) {
      try {
        const config = JSON.parse(fs.readFileSync(filename).toString());
        configEditorWindow?.webContents.send('configFile', {
          filename,
          basename: path.basename(filename),
          config,
        });
      } catch (e: any) {
        dialog.showErrorBox("Can't open config file.", e.message);
      }
    }
  });
  // configEditorWindow.webContents.openDevTools();

  configEditorWindow.on('close', () => {
    configEditorWindow = undefined;
    makeTray();
  });

  configEditorWindow.on('closed', () => {
    // This is necessary until this is fixed: https://github.com/electron/electron/issues/46882
    app.emit('browser-window-blur');
  });

  configEditorWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  makeTray();
};

const createHelpWindow = () => {
  if (helpWindow) {
    helpWindow.focus();
    return;
  }

  helpWindow = new BrowserWindow({
    webPreferences: {
      partition: 'persist:settings',
      preload: path.join(__dirname, '..', 'assets', 'preload.js'),
    },
    title: 'Help',
    icon: path.join(__dirname, '..', 'assets', 'logo.png'),
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    autoHideMenuBar: true,
  });

  helpWindow.loadFile('/app/build/help.html');

  helpWindow.on('close', () => {
    helpWindow = undefined;
  });

  helpWindow.on('closed', () => {
    // This is necessary until this is fixed: https://github.com/electron/electron/issues/46882
    app.emit('browser-window-blur');
  });

  helpWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
};

const makeTray = () => {
  if (!tray) {
    tray = new Tray(path.resolve(__dirname, '..', 'assets', 'logo.png'));
    tray.setToolTip('Stream Overlay');
  }
  const contextMenu = Menu.buildFromTemplate([
    ...wins.map(({ conf, win }, index) => ({
      label: conf.title || 'Window ' + (index + 1),
      click: async () => {
        if (win) {
          win.focus();
        } else {
          createOverlayWindow(conf);
        }
      },
    })),
    ...(configEditorWindow && wins.length
      ? ([
          { type: 'separator' },
          {
            label: 'Close All Overlays',
            click: () => {
              for (let entry of wins) {
                // Use setImmediate so the actions in the close event don't
                // prevent the rest from closing.
                setImmediate(() => {
                  entry.win.close();
                });
              }
            },
          },
        ] as (MenuItemConstructorOptions | MenuItem)[])
      : []),
    { type: 'separator' },
    {
      label: 'Config Editor',
      click: () => {
        createConfigEditorWindow();
      },
    },
    {
      label: 'Help',
      click: () => {
        createHelpWindow();
      },
    },
    {
      label: 'Homepage' + (updateAvailable ? ' (Update Available)' : ''),
      click: async () => {
        const { shell } = require('electron');
        await shell.openExternal('https://github.com/hperrin/stream-overlay');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: async () => {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
};

let config: Conf[] = [];

const createOverlayWindows = () => {
  for (let entry of config) {
    createOverlayWindow(entry);
  }
};

const launchConfigFile = (filename: string) => {
  try {
    const userConfig = JSON.parse(fs.readFileSync(filename).toString());
    if (!Array.isArray(userConfig)) {
      throw new Error('Config is not an array.');
    }
    if (userConfig.length < 1) {
      throw new Error('Config array is empty.');
    }
    for (let entry of userConfig) {
      const { url } = entry;
      if (typeof url !== 'string') {
        throw new Error(
          'Config entry is not valid (url is required): ' +
            JSON.stringify(entry),
        );
      }
      config.push(entry);
    }
  } catch (e: any) {
    dialog.showErrorBox('Error reading config file.', e.message);
    app.exit(1);
  }
};

let tray: Tray | undefined;
let updateAvailable = false;

app.on('open-file', (_event, path) => {
  launchConfigFile(path);
});

app.whenReady().then(() => {
  const partition = 'persist:settings';
  const ses = session.fromPartition(partition);

  ses.protocol.interceptFileProtocol('file', (request, callback) => {
    let url = request.url.substring(7);
    if (process.platform === 'win32') {
      url = url.replace(/^\/\w+:/, () => '');
    }
    callback({ path: path.normalize(`${__dirname}/../${url}`) });
  });

  readSettings();

  if (!configured) {
    const defaultConfigFile = getDefaultConfigFile();
    if (fs.existsSync(configFile)) {
      launchConfigFile(configFile);
    } else if (defaultConfigFile) {
      launchConfigFile(defaultConfigFile);
    } else {
      createConfigEditorWindow();
    }
  } else {
    config.push({
      title,
      url,
      display,
      fullscreen,
      coverTaskbar,
      x,
      y,
      xAlign,
      yAlign,
      width,
      height,
      scale,
      opacity,
    });
  }

  createOverlayWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createOverlayWindows();
  });

  app.on('browser-window-blur', () => {
    const windows = BaseWindow.getAllWindows();
    for (let window of windows) {
      if (!window.isMaximizable()) {
        // This is necessary until this is fixed: https://github.com/electron/electron/issues/46882
        window.setMaximizable(false);
      }
    }
  });

  makeTray();
  const req = https.request(
    {
      hostname: 'github.com',
      port: 443,
      path: '/hperrin/stream-overlay/releases/latest',
      method: 'HEAD',
    },
    (res) => {
      if (
        res.statusCode !== 302 ||
        !res.headers.location?.endsWith('v' + pkg.version)
      ) {
        updateAvailable = true;
        makeTray();
      }
    },
  );

  req.on('error', (e) => {
    console.error('Update check error: ', e);
  });
  req.end();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
