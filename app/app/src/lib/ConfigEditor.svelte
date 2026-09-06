<div class="workspace">
  <aside class="pane windows-pane">
    <div class="pane-header">
      <span class="pane-title">Windows</span>
      <span class="pane-count">{config.length}</span>
    </div>

    <div class="window-list">
      {#each config as win, i}
        <div
          class="window-row"
          class:active={selected === i}
          role="button"
          tabindex="0"
          onclick={() => (selected = i)}
          onkeydown={(event) =>
            (event.key === 'Enter' || event.key === ' ') && (selected = i)}
        >
          <span
            class="state-dot"
            class:running={isRunning(i)}
            title={isRunning(i) ? 'Open' : 'Not open'}
          ></span>
          <span class="row-text">
            <span class="row-title">{win.title || `Window ${i + 1}`}</span>
            <span class="row-summary">{summarize(win)}</span>
          </span>
          <span class="row-actions">
            <button
              class="icon-button"
              title="Move up"
              aria-label="Move up"
              disabled={i === 0}
              onclick={(event) => {
                event.stopPropagation();
                move(i, -1);
              }}>↑</button
            >
            <button
              class="icon-button"
              title="Move down"
              aria-label="Move down"
              disabled={i === config.length - 1}
              onclick={(event) => {
                event.stopPropagation();
                move(i, 1);
              }}>↓</button
            >
          </span>
        </div>
      {/each}
    </div>

    <button class="add-window" onclick={addWindow}>
      <span class="add-mark">+</span> Add Window
    </button>
  </aside>

  <section class="pane canvas-pane">
    {#if displays.length}
      <LayoutPreview bind:config {displays} {running} {uid} bind:selected />
    {:else}
      <div class="pane-empty">
        <small class="text-muted">Looking for displays…</small>
      </div>
    {/if}
  </section>

  <aside class="pane inspector-pane">
    {#if activeWindow}
      <div class="pane-header">
        <span class="pane-title">{activeWindow.title || 'Window'}</span>
        <div class="inspector-actions">
          {#if isRunning(selected)}
            <button
              class="btn btn-sm btn-secondary"
              onclick={() =>
                electronAPI.requestCloseWindow({ uid, index: selected })}
              >Close</button
            >
          {:else}
            <div class="dropdown">
              <button
                class="btn btn-sm btn-purple dropdown-toggle"
                type="button"
                id="launchWindow"
                data-bs-toggle="dropdown"
                aria-expanded="false">Launch</button
              >
              <ul
                class="dropdown-menu dropdown-menu-end"
                aria-labelledby="launchWindow"
              >
                <li>
                  <button
                    class="dropdown-item"
                    onclick={() => launch(selected, 'clickable')}
                    >Clickable</button
                  >
                </li>
                <li>
                  <button
                    class="dropdown-item"
                    onclick={() => launch(selected, 'normal')}
                    >Click-Through</button
                  >
                </li>
              </ul>
            </div>
          {/if}
        </div>
      </div>

      <div class="inspector-body">
        <WindowEditor bind:win={config[selected]} {displays} />
      </div>

      <div class="inspector-footer">
        <button
          class="btn btn-sm btn-secondary"
          onclick={() => duplicate(selected)}>Duplicate</button
        >
        <button
          class="btn btn-sm btn-outline-danger"
          onclick={() => removeWindow(selected)}>Remove</button
        >
      </div>
    {:else}
      <div class="pane-empty">
        <small class="text-muted">Select a window to edit it.</small>
      </div>
    {/if}
  </aside>
</div>

<script lang="ts">
  import {
    normalizeConf,
    type Conf,
    type DisplayInfo,
    type WindowSource,
  } from '$lib/Conf';
  import electronAPI from '$lib/electronAPI';
  import LayoutPreview from '$lib/LayoutPreview.svelte';
  import WindowEditor from '$lib/WindowEditor.svelte';

  let {
    config = $bindable(),
    uid = '',
    displays = [],
    running = [],
  }: {
    config: Conf[];
    uid?: string;
    displays?: DisplayInfo[];
    running?: WindowSource[];
  } = $props();

  let selected = $state(0);
  let activeWindow = $derived(config[selected]);

  function isRunning(index: number) {
    return running.some(
      (source) => source.uid === uid && source.index === index,
    );
  }

  function summarize(win: Conf) {
    if (win.fullscreen) {
      return 'Fullscreen';
    }

    const place = `${win.yAlign ?? 'top'} ${win.xAlign ?? 'left'}`;
    const size = `${format(win.width)}×${format(win.height)}`;

    return `${place} · ${size}`;
  }

  function format(value: number | string | undefined) {
    return typeof value === 'string' ? value : Math.round(value ?? 0);
  }

  function launch(i: number, mode: 'normal' | 'clickable') {
    electronAPI.requestLaunch({
      config: [$state.snapshot(config[i])],
      mode,
      uid,
      indexes: [i],
    });
  }

  function addWindow() {
    config.push(
      normalizeConf({
        title: 'Untitled Window',
        url: 'https://example.com/',
        display: 0,
        fullscreen: false,
        coverTaskbar: false,
        xAlign: 'center',
        yAlign: 'center',
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        scale: 1,
        opacity: 1,
      }),
    );
    config = config;
    selected = config.length - 1;
  }

  function duplicate(i: number) {
    const copy = structuredClone($state.snapshot(config[i]));
    copy.title = `${copy.title || 'Window'} copy`;
    config.splice(i + 1, 0, copy);
    config = config;
    selected = i + 1;
  }

  function removeWindow(i: number) {
    config.splice(i, 1);
    config = config;
    selected = Math.min(i, config.length - 1);
  }

  function move(i: number, by: number) {
    const win = config.splice(i, 1)[0];
    config.splice(i + by, 0, win);
    config = config;
    selected = i + by;
  }
</script>

<style>
  .workspace {
    display: grid;
    grid-template-columns:
      clamp(160px, 16vw, 230px) minmax(0, 1fr)
      clamp(260px, 26vw, 360px);
    gap: 0.75rem;
    height: 100%;
    min-height: 0;
  }

  .pane {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid var(--so-border);
    border-radius: var(--so-radius);
    background-color: var(--so-surface);
    overflow: hidden;
  }

  .pane-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--so-border);
  }

  .pane-title {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--bs-secondary-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pane-count {
    font-size: 0.75rem;
    color: var(--bs-secondary-color);
  }

  .pane-empty {
    display: grid;
    place-items: center;
    height: 100%;
    padding: 1rem;
    text-align: center;
  }

  .window-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.35rem;
  }

  .window-row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    padding: 0.45rem 0.5rem;
    border-radius: var(--so-radius-sm);
    cursor: pointer;
    border: 1px solid transparent;
  }
  .window-row:hover {
    background-color: var(--so-accent-soft);
  }
  .window-row.active {
    background-color: var(--so-accent-soft);
    border-color: var(--so-accent);
  }

  .state-dot {
    flex: none;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--so-border);
  }
  .state-dot.running {
    background-color: #2ec27e;
  }

  .row-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .row-title {
    font-size: 0.9rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-summary {
    font-size: 0.72rem;
    color: var(--bs-secondary-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-actions {
    display: none;
    gap: 0.15rem;
  }
  .window-row:hover .row-actions,
  .window-row.active .row-actions {
    display: flex;
  }

  .icon-button {
    width: 1.4rem;
    height: 1.4rem;
    padding: 0;
    border: none;
    border-radius: 0.35rem;
    background-color: transparent;
    color: var(--bs-secondary-color);
    line-height: 1;
  }
  .icon-button:hover:not(:disabled) {
    background-color: var(--so-surface-sunken);
    color: var(--bs-body-color);
  }
  .icon-button:disabled {
    opacity: 0.3;
  }

  .add-window {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin: 0.35rem;
    padding: 0.5rem;
    border: 1px dashed var(--so-border);
    border-radius: var(--so-radius-sm);
    background-color: transparent;
    color: var(--bs-secondary-color);
    font-size: 0.85rem;
    font-weight: 500;
  }
  .add-window:hover {
    border-color: var(--so-accent);
    background-color: var(--so-accent-soft);
    color: var(--bs-body-color);
  }

  .add-mark {
    font-size: 1.1rem;
    line-height: 1;
  }

  .canvas-pane {
    padding: 0.9rem;
    justify-content: center;
    background-color: var(--so-surface-sunken);
  }

  .inspector-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .inspector-actions {
    display: flex;
    gap: 0.4rem;
  }

  .inspector-footer {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border-top: 1px solid var(--so-border);
  }

  /* Narrower: give the canvas the full width and put the list and the
     inspector under it. */
  @media (max-width: 1150px) {
    .workspace {
      grid-template-columns: minmax(150px, 190px) minmax(0, 1fr);
      grid-template-rows: minmax(170px, 38%) minmax(0, 1fr);
    }
    .canvas-pane {
      grid-column: 1 / -1;
      grid-row: 1;
    }
    .windows-pane,
    .inspector-pane {
      grid-row: 2;
    }
  }

  /* Narrow enough that side by side isn't worth it: one column, with the
     window list as a short scrolling strip. */
  @media (max-width: 700px) {
    .workspace {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(140px, 30%) auto minmax(0, 1fr);
    }
    .canvas-pane {
      grid-column: 1;
      grid-row: 1;
    }
    .windows-pane {
      grid-row: 2;
      max-height: 11rem;
    }
    .inspector-pane {
      grid-row: 3;
    }
  }
</style>
