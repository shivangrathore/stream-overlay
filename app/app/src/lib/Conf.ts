export type XAlign = 'left' | 'center' | 'right';
export type YAlign = 'top' | 'center' | 'bottom';

export type Conf = {
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

export type WindowPosition = {
  uid: string;
  index: number;
  position: {
    display: number;
    x: number | string;
    y: number | string;
    width: number | string;
    height: number | string;
  };
};

export type Settings = {
  defaultConfigFile?: string;
};

export type ConfContainer = {
  filename: string;
  basename: string;
  config: Conf[];
  origConfig?: string;
  uid?: string;
};

/**
 * Fill in missing properties and convert legacy values (x/y of -1 meaning
 * centered) to the current format. Idempotent.
 */
export function normalizeConf(win: Conf): Conf {
  if (!('display' in win)) {
    win.display = 0;
  }
  if (!('fullscreen' in win)) {
    win.fullscreen = false;
  }
  if (!('coverTaskbar' in win)) {
    win.coverTaskbar = false;
  }
  if (!('scale' in win)) {
    win.scale = 1;
  }
  if (!('opacity' in win)) {
    win.opacity = 1;
  }
  if (!('xAlign' in win)) {
    win.xAlign = win.x === -1 ? 'center' : 'left';
  }
  if (!('yAlign' in win)) {
    win.yAlign = win.y === -1 ? 'center' : 'top';
  }
  if (win.x === -1) {
    win.x = 0;
  }
  if (win.y === -1) {
    win.y = 0;
  }
  return win;
}
