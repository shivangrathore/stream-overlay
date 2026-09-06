{#if displays.length}
  <LayoutPreview bind:config {displays} {running} {uid} bind:selected />
{/if}

<div class="window-grid">
  {#each config as win, i}
    <div
      class="card window-card"
      class:selected={selected === i}
      onpointerdown={() => (selected = i)}
    >
      <div class="card-header">
        <div class="window-name">
          <span class="window-index">{i + 1}</span>
          <span class="window-title" title={win.title}>{win.title}</span>
          {#if isRunning(i)}
            <span class="running-dot" title="This window is open."></span>
          {/if}
        </div>
        <div class="dropdown">
          <button
            class="btn btn-sm btn-purple dropdown-toggle"
            type="button"
            id="launchDropdown{i}"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Launch
          </button>
          <ul
            class="dropdown-menu dropdown-menu-end"
            aria-labelledby="launchDropdown{i}"
          >
            <li>
              <button
                class="dropdown-item"
                onclick={() => launch(i, 'clickable')}>Clickable</button
              >
            </li>
            <li>
              <button class="dropdown-item" onclick={() => launch(i, 'normal')}
                >Click-Through</button
              >
            </li>
          </ul>
        </div>
      </div>
      <div class="card-body window-body">
        <div class="card-text">
          <WindowEditor bind:win={config[i]} />
        </div>
        <div class="card-actions">
          <div class="reorder">
            <button
              class="btn btn-sm btn-secondary"
              title="Move left"
              aria-label="Move left"
              disabled={i === 0}
              onclick={() => moveLeft(i)}>&lt;</button
            >
            <button
              class="btn btn-sm btn-secondary"
              title="Move right"
              aria-label="Move right"
              disabled={i === config.length - 1}
              onclick={() => moveRight(i)}>&gt;</button
            >
          </div>
          <div class="card-actions-end">
            {#if isRunning(i)}
              <button
                class="btn btn-sm btn-secondary"
                title="Close this overlay window."
                onclick={() =>
                  electronAPI.requestCloseWindow({ uid, index: i })}
                >Close</button
              >
            {/if}
            <button
              class="btn btn-sm btn-outline-danger"
              onclick={() => removeWindow(i)}>Remove</button
            >
          </div>
        </div>
      </div>
    </div>
  {/each}

  <button class="add-card" onclick={addWindow}>
    <span class="add-mark">+</span>
    <span>Add Window</span>
  </button>
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

  let selected = $state(-1);

  function isRunning(index: number) {
    return running.some(
      (source) => source.uid === uid && source.index === index,
    );
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
  }

  function removeWindow(i: number) {
    config.splice(i, 1);
    config = config;
  }

  function moveLeft(i: number) {
    const win = config.splice(i, 1)[0];
    config.splice(i - 1, 0, win);
    config = config;
  }

  function moveRight(i: number) {
    const win = config.splice(i, 1)[0];
    config.splice(i + 1, 0, win);
    config = config;
  }
</script>

<style>
  .window-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    align-items: stretch;
    gap: 1rem;
    margin: 1rem 0;
  }

  .window-card {
    overflow: hidden;
  }

  .window-card.selected {
    border-color: var(--so-accent);
    box-shadow:
      0 0 0 2px var(--so-accent-soft),
      var(--so-shadow);
  }

  .running-dot {
    flex: none;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: #2ec27e;
  }

  .card-actions-end {
    display: flex;
    gap: 0.4rem;
  }

  .window-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .window-name {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .window-index {
    display: grid;
    place-items: center;
    flex: none;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 0.5rem;
    background-color: var(--so-accent-soft);
    color: var(--so-accent);
    font-size: 0.8rem;
    font-weight: 700;
  }

  .window-title {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .window-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1rem;
  }

  .card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--so-border);
  }

  .reorder {
    display: flex;
    gap: 0.4rem;
  }

  .add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-height: 12rem;
    padding: 2rem 1rem;
    border: 1px dashed var(--so-border);
    border-radius: var(--so-radius);
    background-color: transparent;
    color: var(--bs-secondary-color);
    font-weight: 600;
    transition:
      border-color 0.15s ease,
      color 0.15s ease,
      background-color 0.15s ease;
  }
  .add-card:hover {
    border-color: var(--so-accent);
    background-color: var(--so-accent-soft);
    color: var(--bs-body-color);
  }

  .add-mark {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: var(--so-accent);
    color: #fff;
    font-size: 1.5rem;
    line-height: 1;
  }
</style>
