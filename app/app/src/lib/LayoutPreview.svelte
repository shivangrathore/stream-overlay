<div class="preview" class:empty={!displays.length}>
  {#if displays.length}
    <svg
      bind:this={svg}
      viewBox="{canvas.x} {canvas.y} {canvas.width} {canvas.height}"
      style="aspect-ratio: {canvas.width} / {canvas.height};"
      role="presentation"
      onpointermove={handlePointerMove}
      onpointerup={endDrag}
      onpointercancel={endDrag}
    >
      {#each displays as display}
        <rect
          class="display"
          x={display.bounds.x}
          y={display.bounds.y}
          width={display.bounds.width}
          height={display.bounds.height}
          rx={12}
        />
        <rect
          class="work-area"
          x={display.workArea.x}
          y={display.workArea.y}
          width={display.workArea.width}
          height={display.workArea.height}
        />
        <text
          class="display-label"
          x={display.bounds.x + 18}
          y={display.bounds.y + 44}
          style="font-size: {28 * unit}px;">{display.label}</text
        >
      {/each}

      {#each rects as rect, i}
        <g
          class="window"
          class:selected={selected === i}
          class:running={isRunning(i)}
        >
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            role="button"
            tabindex="0"
            aria-label="Move {config[i].title || `Window ${i + 1}`}"
            onpointerdown={(event) => startDrag(event, i, 'move')}
            onkeydown={(event) => nudge(event, i)}
          />
          <text
            class="window-label"
            x={rect.x + rect.width / 2}
            y={rect.y + rect.height / 2}
            style="font-size: {26 * unit}px;"
            >{config[i].title || `Window ${i + 1}`}</text
          >
          {#if !config[i].fullscreen}
            <rect
              class="grip"
              x={rect.x + rect.width - 30 * unit}
              y={rect.y + rect.height - 30 * unit}
              width={30 * unit}
              height={30 * unit}
              role="button"
              tabindex="-1"
              aria-label="Resize {config[i].title || `Window ${i + 1}`}"
              onpointerdown={(event) => startDrag(event, i, 'resize')}
            />
          {/if}
        </g>
      {/each}
    </svg>

    <small class="preview-hint text-muted"
      >Drag to place, drag the corner to resize, arrow keys nudge (Shift for
      10&nbsp;px).</small
    >
  {:else}
    <small class="text-muted">Looking for displays…</small>
  {/if}
</div>

<script lang="ts">
  import {
    resolveRect,
    setRectPosition,
    setRectSize,
    type Conf,
    type DisplayInfo,
    type Rect,
    type WindowSource,
  } from '$lib/Conf';

  let {
    config = $bindable(),
    displays,
    running = [],
    uid = '',
    selected = $bindable(-1),
  }: {
    config: Conf[];
    displays: DisplayInfo[];
    running?: WindowSource[];
    uid?: string;
    selected?: number;
  } = $props();

  let svg: SVGSVGElement | undefined = $state();

  // Everything is drawn in desktop coordinates, with a little air around it.
  let canvas = $derived.by(() => {
    if (!displays.length) {
      return { x: 0, y: 0, width: 1920, height: 1080 };
    }

    const left = Math.min(...displays.map((d) => d.bounds.x));
    const top = Math.min(...displays.map((d) => d.bounds.y));
    const right = Math.max(...displays.map((d) => d.bounds.x + d.bounds.width));
    const bottom = Math.max(
      ...displays.map((d) => d.bounds.y + d.bounds.height),
    );
    const margin = Math.round((right - left) * 0.02);

    return {
      x: left - margin,
      y: top - margin,
      width: right - left + margin * 2,
      height: bottom - top + margin * 2,
    };
  });

  // Desktop pixels per drawn pixel, so handles stay a usable size.
  let unit = $derived(canvas.width / 1600);

  let rects: Rect[] = $derived(config.map((win) => resolveRect(win, displays)));

  function isRunning(index: number) {
    return running.some(
      (source) => source.uid === uid && source.index === index,
    );
  }

  let drag:
    | {
        index: number;
        mode: 'move' | 'resize';
        startX: number;
        startY: number;
        rect: Rect;
      }
    | undefined;

  function toDesktop(event: PointerEvent) {
    const box = svg?.getBoundingClientRect();
    if (!box) {
      return { x: 0, y: 0 };
    }

    return {
      x: canvas.x + ((event.clientX - box.left) / box.width) * canvas.width,
      y: canvas.y + ((event.clientY - box.top) / box.height) * canvas.height,
    };
  }

  function startDrag(
    event: PointerEvent,
    index: number,
    mode: 'move' | 'resize',
  ) {
    event.preventDefault();
    selected = index;

    if (config[index].fullscreen && mode === 'resize') {
      return;
    }

    const point = toDesktop(event);
    drag = {
      index,
      mode,
      startX: point.x,
      startY: point.y,
      rect: { ...rects[index] },
    };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!drag) {
      return;
    }

    const point = toDesktop(event);
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    const win = config[drag.index];

    if (drag.mode === 'move') {
      const x = drag.rect.x + dx;
      const y = drag.rect.y + dy;

      // Follow the window onto whichever display it's dropped on.
      const display = displays.find(
        (entry) =>
          x + drag!.rect.width / 2 >= entry.bounds.x &&
          x + drag!.rect.width / 2 < entry.bounds.x + entry.bounds.width &&
          y + drag!.rect.height / 2 >= entry.bounds.y &&
          y + drag!.rect.height / 2 < entry.bounds.y + entry.bounds.height,
      );
      if (display && display.value !== win.display) {
        win.display = display.value;
      }

      setRectPosition(win, snap(win, { x, y }), displays);
    } else {
      setRectSize(
        win,
        {
          width: drag.rect.width + dx,
          height: drag.rect.height + dy,
        },
        displays,
      );
    }
  }

  // Pull to the edges and the middle of the display it's on.
  function snap(win: Conf, position: { x: number; y: number }) {
    const rect = rects[config.indexOf(win)];
    const area = displays.find((entry) => entry.value === (win.display ?? 0));
    if (!area) {
      return position;
    }

    const box = win.coverTaskbar ? area.bounds : area.workArea;
    const threshold = canvas.width * 0.006;
    const targets = [
      { value: box.x, at: position.x },
      { value: box.x + box.width / 2 - rect.width / 2, at: position.x },
      { value: box.x + box.width - rect.width, at: position.x },
    ];
    const verticals = [
      { value: box.y, at: position.y },
      { value: box.y + box.height / 2 - rect.height / 2, at: position.y },
      { value: box.y + box.height - rect.height, at: position.y },
    ];

    let { x, y } = position;
    for (let target of targets) {
      if (Math.abs(target.value - target.at) < threshold) {
        x = target.value;
      }
    }
    for (let target of verticals) {
      if (Math.abs(target.value - target.at) < threshold) {
        y = target.value;
      }
    }

    return { x, y };
  }

  function endDrag() {
    drag = undefined;
  }

  function nudge(event: KeyboardEvent, index: number) {
    const steps: { [key: string]: [number, number] } = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const step = steps[event.key];
    if (!step) {
      return;
    }

    event.preventDefault();
    const distance = event.shiftKey ? 10 : 1;
    const rect = rects[index];

    setRectPosition(
      config[index],
      { x: rect.x + step[0] * distance, y: rect.y + step[1] * distance },
      displays,
    );
  }
</script>

<style>
  .preview {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.6rem;
    height: 100%;
    min-height: 0;
  }

  .preview.empty {
    align-items: center;
  }

  svg {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    min-height: 0;
    margin: 0 auto;
    flex: 0 1 auto;
    touch-action: none;
  }

  .display {
    fill: var(--so-surface-sunken);
    stroke: var(--so-border);
    stroke-width: 2;
  }

  .work-area {
    fill: none;
    stroke: var(--so-border);
    stroke-dasharray: 8 8;
    stroke-width: 2;
  }

  .preview-hint {
    text-align: center;
  }

  .display-label {
    fill: var(--bs-secondary-color);
    opacity: 0.7;
  }

  .window rect {
    fill: var(--so-accent-soft);
    stroke: var(--so-accent);
    stroke-width: 2;
    cursor: grab;
  }

  .window.running rect {
    fill: var(--so-accent);
    fill-opacity: 0.35;
  }

  .window.selected rect {
    stroke-width: 4;
  }

  .window .grip {
    fill: var(--so-accent);
    cursor: nwse-resize;
  }

  .window-label {
    fill: var(--bs-body-color);
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
  }
</style>
