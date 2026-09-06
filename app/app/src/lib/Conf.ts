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

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DisplayInfo = {
  value: number;
  label: string;
  primary: boolean;
  bounds: Rect;
  workArea: Rect;
};

export type WindowSource = {
  uid: string;
  index: number;
};

export type Overlays = {
  count: number;
  editMode: boolean;
  running: WindowSource[];
};

export type Settings = {
  defaultConfigFile?: string;
  editModeShortcut?: string;
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

const DEFAULTS = {
  x: 0,
  y: 0,
  width: 550,
  height: 650,
};

function getLength(value: number | string | undefined, total: number) {
  if (typeof value === 'string') {
    const percent = parseFloat(value);
    return isNaN(percent) ? 0 : (percent / 100) * total;
  }
  return value ?? 0;
}

/** The part of the display a window is placed against. */
export function getArea(conf: Conf, displays: DisplayInfo[]): Rect {
  const display =
    displays.find((entry) => entry.value === (conf.display ?? 0)) ??
    displays.find((entry) => entry.primary) ??
    displays[0];

  if (!display) {
    return { x: 0, y: 0, width: 1920, height: 1080 };
  }

  return conf.coverTaskbar ? display.bounds : display.workArea;
}

/** Where a window ends up on screen, in desktop coordinates. */
export function resolveRect(conf: Conf, displays: DisplayInfo[]): Rect {
  const area = getArea(conf, displays);

  if (conf.fullscreen) {
    return { ...area };
  }

  const width = Math.round(getLength(conf.width ?? DEFAULTS.width, area.width));
  const height = Math.round(
    getLength(conf.height ?? DEFAULTS.height, area.height),
  );

  const align = (
    offset: number | string | undefined,
    alignment: XAlign | YAlign | undefined,
    size: number,
    total: number,
  ) => {
    const length = getLength(offset ?? 0, total);
    switch (alignment) {
      case 'center':
        return Math.max(0, Math.round(total / 2 - size / 2 + length));
      case 'right':
      case 'bottom':
        return Math.round(total - size - length);
      default:
        return Math.round(length);
    }
  };

  return {
    x: area.x + align(conf.x, conf.xAlign, width, area.width),
    y: area.y + align(conf.y, conf.yAlign, height, area.height),
    width,
    height,
  };
}

function toUnits(
  value: number,
  total: number,
  original: number | string | undefined,
) {
  if (typeof original === 'string') {
    return `${Math.round((value / total) * 10000) / 100}%`;
  }
  return Math.round(value);
}

/** Write a screen position back into the config, keeping alignment and units. */
export function setRectPosition(
  conf: Conf,
  position: { x: number; y: number },
  displays: DisplayInfo[],
) {
  const area = getArea(conf, displays);
  const { width, height } = resolveRect(conf, displays);

  const offset = (
    value: number,
    size: number,
    areaStart: number,
    areaSize: number,
    alignment: XAlign | YAlign | undefined,
  ) => {
    switch (alignment) {
      case 'center':
        return value - areaStart - (areaSize / 2 - size / 2);
      case 'right':
      case 'bottom':
        return areaStart + areaSize - (value + size);
      default:
        return value - areaStart;
    }
  };

  conf.x = toUnits(
    offset(position.x, width, area.x, area.width, conf.xAlign),
    area.width,
    conf.x,
  );
  conf.y = toUnits(
    offset(position.y, height, area.y, area.height, conf.yAlign),
    area.height,
    conf.y,
  );
}

/** Write a screen size back into the config, keeping units. */
export function setRectSize(
  conf: Conf,
  size: { width: number; height: number },
  displays: DisplayInfo[],
) {
  const area = getArea(conf, displays);

  conf.width = toUnits(Math.max(45, size.width), area.width, conf.width);
  conf.height = toUnits(Math.max(30, size.height), area.height, conf.height);
}
