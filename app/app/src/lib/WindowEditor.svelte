<div class="field">
  <label for="title{i}" class="form-label">Title</label>
  <input
    type="text"
    class="form-control form-control-sm"
    id="title{i}"
    bind:value={win.title}
  />
</div>

<div class="field">
  <label for="url{i}" class="form-label"
    >URL{#if win.url.includes('YOURSECRETCODE')}&nbsp;<span
        tabindex="0"
        style="text-decoration: dotted; cursor: help;"
        title="It looks like you haven't filled in your Widget URL. Head to streamlabs.com (or other widget provider, e.g. Twitch, jChat, etc.) to get the URL for your widget."
        >&#9888;</span
      >{/if}</label
  >
  <div class="input-group">
    {#if showUrl}
      <input
        type="text"
        class="form-control form-control-sm"
        id="url{i}"
        bind:value={win.url}
      />
    {:else}
      <input
        type="password"
        class="form-control form-control-sm"
        id="url{i}"
        bind:value={win.url}
      />
    {/if}
    <button
      class="input-group-text"
      title={showUrl ? 'Hide URL' : 'Show URL'}
      onclick={() => (showUrl = !showUrl)}>👀</button
    >
  </div>
</div>

<div class="section">
  <div class="section-label">Position</div>

  <div class="field">
    <label for="display{i}" class="form-label">Display</label>
    {#if displays.length}
      <select
        class="form-select form-select-sm"
        id="display{i}"
        bind:value={win.display}
      >
        {#each displays as display}
          <option value={display.value}
            >{display.label} · {display.bounds.width}×{display.bounds
              .height}{display.primary ? ' · primary' : ''}</option
          >
        {/each}
      </select>
    {:else}
      <input
        type="number"
        class="form-control form-control-sm"
        id="display{i}"
        min={0}
        max={9}
        step={1}
        bind:value={win.display}
      />
      <small class="form-text text-muted">0 means primary monitor.</small>
    {/if}
  </div>

  <div class="switches">
    <div class="form-check form-switch">
      <input
        type="checkbox"
        role="switch"
        class="form-check-input"
        id="fullscreen{i}"
        bind:checked={win.fullscreen}
      />
      <label for="fullscreen{i}" class="form-check-label">Fullscreen</label>
    </div>

    <div class="form-check form-switch">
      <input
        type="checkbox"
        role="switch"
        class="form-check-input"
        id="coverTaskbar{i}"
        bind:checked={win.coverTaskbar}
      />
      <label for="coverTaskbar{i}" class="form-check-label"
        >Cover taskbar (use whole display)</label
      >
    </div>
  </div>

  {#if !win.fullscreen}
    <div class="align-row">
      <div class="align-grid">
        {#each yAligns as yAlign}
          {#each xAligns as xAlign}
            <button
              type="button"
              class="align-button"
              class:active={win.xAlign === xAlign && win.yAlign === yAlign}
              title="{alignLabels[yAlign]} {alignLabels[xAlign]}"
              aria-label="{alignLabels[yAlign]} {alignLabels[xAlign]}"
              aria-pressed={win.xAlign === xAlign && win.yAlign === yAlign}
              onclick={() => setAlign(xAlign, yAlign)}
              >{alignIcons[`${xAlign} ${yAlign}`]}</button
            >
          {/each}
        {/each}
      </div>
      <div class="align-info">
        <div class="align-current">
          {alignLabels[win.yAlign ?? 'top']}
          {alignLabels[win.xAlign ?? 'left']}
        </div>
        <small class="text-muted"
          >Offsets are measured inward from the edge you pick.</small
        >
        <button
          type="button"
          class="btn btn-sm btn-secondary"
          onclick={fillScreen}>Fill screen area</button
        >
      </div>
    </div>

    <div class="pair">
      <div class="field">
        <span class="form-label"
          >X offset ({win.xAlign === 'right'
            ? 'from right'
            : win.xAlign === 'center'
              ? 'from center'
              : 'from left'})</span
        >
        <NumberEditor bind:value={win.x} allowNegative />
      </div>
      <div class="field">
        <span class="form-label"
          >Y offset ({win.yAlign === 'bottom'
            ? 'from bottom'
            : win.yAlign === 'center'
              ? 'from center'
              : 'from top'})</span
        >
        <NumberEditor bind:value={win.y} allowNegative />
      </div>
    </div>

    <div class="section-label">Size</div>
    <div class="pair">
      <div class="field">
        <span class="form-label">Width</span>
        <NumberEditor bind:value={win.width} />
      </div>
      <div class="field">
        <span class="form-label">Height</span>
        <NumberEditor bind:value={win.height} />
      </div>
    </div>
  {/if}
</div>

<div class="section">
  <div class="section-label">Appearance</div>

  <div class="field">
    <label for="scale{i}" class="form-label">Scale</label>
    <div class="input-group">
      <input
        type="number"
        class="form-control form-control-sm"
        id="scale{i}"
        min={0.3}
        max={5}
        step={0.1}
        bind:value={win.scale}
      />
      <span class="input-group-text">{Math.round((win.scale ?? 1) * 100)}%</span
      >
    </div>
  </div>

  <div class="field">
    <label for="opacity{i}" class="form-label">Opacity</label>
    <div class="range-row">
      <input
        type="range"
        class="form-range"
        id="opacity{i}"
        min={0.1}
        max={1}
        step={0.05}
        bind:value={win.opacity}
      />
      <span class="range-value">{Math.round((win.opacity ?? 1) * 100)}%</span>
    </div>
    <small class="form-text text-muted">Doesn't work on Linux.</small>
  </div>
</div>

<script lang="ts" module>
  let counter = 0;
</script>

<script lang="ts">
  import type { Conf, DisplayInfo, XAlign, YAlign } from '$lib/Conf';
  import NumberEditor from '$lib/NumberEditor.svelte';

  let {
    win = $bindable(),
    displays = [],
  }: {
    win: Conf;
    displays?: DisplayInfo[];
  } = $props();

  const xAligns: XAlign[] = ['left', 'center', 'right'];
  const yAligns: YAlign[] = ['top', 'center', 'bottom'];
  const alignLabels: { [k in XAlign | YAlign]: string } = {
    left: 'Left',
    center: 'Center',
    right: 'Right',
    top: 'Top',
    bottom: 'Bottom',
  };
  const alignIcons: { [k: string]: string } = {
    'left top': '↖',
    'center top': '↑',
    'right top': '↗',
    'left center': '←',
    'center center': '⧉',
    'right center': '→',
    'left bottom': '↙',
    'center bottom': '↓',
    'right bottom': '↘',
  };

  let showUrl = $state(false);
  let i = counter++;

  function setAlign(xAlign: XAlign, yAlign: YAlign) {
    win.xAlign = xAlign;
    win.yAlign = yAlign;
  }

  function fillScreen() {
    win.xAlign = 'left';
    win.yAlign = 'top';
    win.x = 0;
    win.y = 0;
    win.width = '100%';
    win.height = '100%';
  }
</script>

<style>
  .field {
    margin-bottom: 0.75rem;
  }

  .section {
    margin-top: 1.1rem;
    padding-top: 0.9rem;
    border-top: 1px solid var(--so-border);
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--bs-secondary-color);
    margin-bottom: 0.5rem;
  }

  .switches {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.9rem;
  }

  .pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 0.75rem;
  }

  .align-row {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
    margin-bottom: 1rem;
  }

  .align-grid {
    display: grid;
    grid-template-columns: repeat(3, 2.3rem);
    grid-auto-rows: 2.3rem;
    gap: 0.3rem;
    flex: none;
  }

  .align-button {
    display: grid;
    place-items: center;
    border: 1px solid var(--so-border);
    border-radius: 0.5rem;
    background-color: transparent;
    color: var(--bs-secondary-color);
    font-size: 1rem;
    line-height: 1;
    transition:
      background-color 0.12s ease,
      border-color 0.12s ease,
      color 0.12s ease;
  }
  .align-button:hover {
    border-color: var(--so-accent);
    color: var(--bs-body-color);
  }
  .align-button.active {
    background-color: var(--so-accent);
    border-color: var(--so-accent);
    color: #fff;
  }

  .align-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
    min-width: 0;
  }

  .align-current {
    font-weight: 600;
  }

  .range-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .range-value {
    flex: none;
    min-width: 3rem;
    text-align: end;
    font-variant-numeric: tabular-nums;
    color: var(--bs-secondary-color);
  }
</style>
