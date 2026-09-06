<svelte:head>
  <title>Config Editor - Stream Overlay</title>
</svelte:head>

<div class="editor-container">
  <header class="app-bar">
    <div class="brand">
      <span class="brand-mark">SO</span>
      <div>
        <div class="brand-title">Stream Overlay</div>
        <div class="brand-subtitle">Config Editor</div>
      </div>
    </div>
    <div class="buttons">
      <button class="btn btn-secondary" onclick={newConfig}>New</button>
      <button
        class="btn btn-secondary"
        onclick={() => electronAPI.requestConfigFile()}>Open</button
      >
      <button
        class="btn btn-secondary"
        onclick={() => electronAPI.requestHelp()}>Help</button
      >
    </div>
  </header>

  {#if configs.length}
    <ul
      class="nav nav-tabs tab-strip"
      style="overflow-x: auto; flex-wrap: nowrap; white-space: nowrap; overflow-y: hidden;"
    >
      {#each configs as entry, i}
        <li class="nav-item">
          <button
            class="nav-link"
            class:active={activeIndex === i}
            aria-current="page"
            title={entry.filename}
            onclick={(event) => handleTabClick(event, i)}
            >{entry.basename}{#if JSON.stringify(entry.config) !== entry.origConfig}<span
                class="unsaved-dot"
                title="Unsaved changes"
              ></span>{/if}<i
              role="button"
              class="close-tab btn-close"
              aria-label="Close"
              onclick={(event) => handleTabCloseClick(event, i)}
              onkeypress={(event) =>
                (event.key === 'Enter' || event.key === 'Space') &&
                handleTabCloseClick(event, i)}
              tabindex={0}
            ></i></button
          >
        </li>
      {/each}
    </ul>
  {/if}

  <div class="tab-container">
    {#key activeIndex}
      {#if activeConfig}
        <div class="toolbar">
          <div class="buttons">
            <button
              class="btn btn-secondary"
              disabled={activeConfig.filename === ''}
              onclick={() =>
                electronAPI.requestSave({
                  config: $state.snapshot(activeConfig.config),
                  filename: activeConfig.filename,
                  uid: activeConfig.uid || '',
                })}>Save</button
            >
            <button
              class="btn btn-secondary"
              onclick={() =>
                electronAPI.requestSaveAs({
                  config: $state.snapshot(activeConfig.config),
                  uid: activeConfig.uid || '',
                })}>Save As</button
            >
            <div class="form-check form-switch startup-switch">
              <input
                type="checkbox"
                role="switch"
                class="form-check-input"
                id="startupConfig"
                disabled={activeConfig.filename === ''}
                checked={isStartupConfig}
                onchange={toggleStartupConfig}
              />
              <label
                for="startupConfig"
                class="form-check-label"
                title={activeConfig.filename === ''
                  ? 'Save this config file first.'
                  : 'Launch this config automatically when Stream Overlay starts.'}
                >Launch on startup</label
              >
            </div>
          </div>
          <div class="launch-buttons">
            <button
              class="btn btn-secondary"
              class:active={editMode}
              aria-pressed={editMode}
              disabled={overlayCount === 0}
              title="Make every overlay clickable and draggable, so they can be arranged."
              onclick={toggleEditMode}>Edit Mode</button
            >
            <button
              class="btn btn-secondary"
              disabled={overlayCount === 0}
              title="Close every open overlay window."
              onclick={() => electronAPI.requestCloseAll()}
              >Close Overlays{#if overlayCount}<span class="count-badge"
                  >{overlayCount}</span
                >{/if}</button
            >
            <div class="dropdown">
              <button
                class="btn btn-purple dropdown-toggle"
                type="button"
                id="launchDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Launch All
              </button>
              <ul
                class="dropdown-menu dropdown-menu-end"
                aria-labelledby="launchDropdown"
              >
                <li>
                  <button
                    class="dropdown-item"
                    onclick={() => launchAll('clickable')}>Clickable</button
                  >
                </li>
                <li>
                  <button
                    class="dropdown-item"
                    onclick={() => launchAll('normal')}>Click-Through</button
                  >
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="shortcut-row">
          <label for="editShortcut" class="form-label mb-0"
            >Edit mode shortcut</label
          >
          <input
            type="text"
            class="form-control form-control-sm"
            data-bs-theme="light"
            id="editShortcut"
            placeholder="Not set, e.g. Control+Alt+O"
            bind:value={shortcut}
            onchange={saveShortcut}
          />
          {#if settings.editModeShortcut}
            <button
              class="btn btn-sm btn-secondary"
              onclick={() => {
                shortcut = '';
                saveShortcut();
              }}>Clear</button
            >
          {/if}
        </div>

        {#if fullscreenApp}
          <div class="notice">
            <strong>A fullscreen app is covering your overlays.</strong>
            Windows hides every overlay while a game runs in exclusive fullscreen.
            Switch the game to borderless, or leave Fullscreen Optimizations turned
            on for it, and the overlays come back.
          </div>
        {/if}

        <p class="hint">
          Drag or resize an overlay window and its position and size update
          here, so you can save where you put it.
        </p>

        <ConfigEditor
          bind:config={activeConfig.config}
          uid={activeConfig.uid || ''}
          {displays}
          {running}
        />
      {:else}
        <div class="empty-state">
          <p class="lead">
            Start by creating a new config file or open an existing one.
          </p>
          <div class="buttons">
            <button class="btn btn-purple" onclick={newConfig}
              >New Config File</button
            >
            <button
              class="btn btn-secondary"
              onclick={() => electronAPI.requestConfigFile()}
              >Open Config File</button
            >
          </div>
        </div>

        <div class="help-panel">
          <Help />
        </div>
      {/if}
    {/key}
  </div>
</div>

<script lang="ts">
  import uniqueId from 'lodash/uniqueId.js';
  import {
    normalizeConf,
    type ConfContainer,
    type DisplayInfo,
    type Settings,
    type WindowSource,
  } from '$lib/Conf';
  import electronAPI from '$lib/electronAPI';
  import ConfigEditor from '$lib/ConfigEditor.svelte';
  import Help from './help/+page.svelte';

  let configs: ConfContainer[] = $state([]);
  let activeIndex = $state(0);
  let activeConfig = $derived(configs[activeIndex]);
  let settings: Settings = $state({});
  let isStartupConfig = $derived(
    !!activeConfig &&
      activeConfig.filename !== '' &&
      settings.defaultConfigFile === activeConfig.filename,
  );

  let overlayCount = $state(0);
  let editMode = $state(false);
  let running: WindowSource[] = $state([]);
  let displays: DisplayInfo[] = $state([]);
  let shortcut = $state('');

  electronAPI.settings((_event, data) => {
    settings = data;
    shortcut = data.editModeShortcut ?? '';
  });
  electronAPI.requestSettings();

  electronAPI.overlays((_event, data) => {
    overlayCount = data.count;
    editMode = data.editMode;
    running = data.running;
  });

  let fullscreenApp = $state(false);

  electronAPI.fullscreenApp((_event, data) => {
    fullscreenApp = data.fullscreenApp;
  });

  electronAPI.displays((_event, data) => {
    displays = data;
  });
  electronAPI.requestDisplays();

  // Push edits to the window a config entry is already running in, so the
  // overlay follows the editor. The JSON we last sent, and the one we last got
  // back from a window being dragged, are both remembered, so an edit isn't
  // echoed back and forth.
  const sentConfigs: { [key: string]: string } = {};

  $effect(() => {
    if (!activeConfig) {
      return;
    }

    const uid = activeConfig.uid || '';

    activeConfig.config.forEach((win, index) => {
      const key = `${uid}:${index}`;
      const json = JSON.stringify(win);

      if (
        !running.some((source) => source.uid === uid && source.index === index)
      ) {
        sentConfigs[key] = json;
        return;
      }

      if (sentConfigs[key] === json) {
        return;
      }

      sentConfigs[key] = json;
      electronAPI.requestUpdateWindow({
        uid,
        index,
        config: $state.snapshot(win),
      });
    });
  });

  function toggleEditMode() {
    electronAPI.requestEditMode({ editMode: !editMode });
  }

  function saveShortcut() {
    electronAPI.requestSetShortcut({ accelerator: shortcut.trim() || null });
  }

  // Reopen the config files from last time. This is asked for here, rather
  // than pushed when the page loads, so nothing is sent before the handlers
  // above are listening.
  let restored = $state(false);
  electronAPI.restored(() => (restored = true));
  electronAPI.requestRestoreFiles();

  // Remember which config files are open, so they come back next time. Not
  // until the old ones are back, or this would save an empty list over them.
  $effect(() => {
    if (!restored) {
      return;
    }

    const filenames = configs
      .map((entry) => entry.filename)
      .filter((filename) => filename !== '');

    electronAPI.requestSetOpenFiles({ filenames });
  });

  electronAPI.windowPosition((_event, { uid, index, position }) => {
    const container = configs.find((check) => check.uid === uid);
    const win = container?.config[index];

    if (!win) {
      return;
    }

    win.display = position.display;
    win.x = position.x;
    win.y = position.y;
    win.width = position.width;
    win.height = position.height;

    // It's already where this says, so don't send it straight back.
    sentConfigs[`${uid}:${index}`] = JSON.stringify(win);
  });

  function toggleStartupConfig() {
    if (!activeConfig || activeConfig.filename === '') {
      return;
    }
    electronAPI.requestSetDefaultConfig({
      filename: isStartupConfig ? null : activeConfig.filename,
    });
  }

  function launchAll(mode: 'normal' | 'clickable') {
    electronAPI.requestLaunch({
      config: $state.snapshot(activeConfig.config),
      mode,
      uid: activeConfig.uid || '',
      indexes: activeConfig.config.map((_win, i) => i),
    });
  }

  electronAPI.configFile((_event, data) => {
    const idx = configs.findIndex((check) => data.filename === check.filename);

    if (idx > -1) {
      activeIndex = idx;
    } else {
      data.uid = uniqueId();
      data.config.forEach((window) => normalizeConf(window));
      data.origConfig = JSON.stringify(data.config);
      configs.push(data);
      activeIndex = configs.length - 1;
    }
  });

  electronAPI.saved((_event, { filename, basename, uid }) => {
    const idx = configs.findIndex((check) => uid === check.uid);

    if (idx > -1) {
      configs[idx].filename = filename;
      configs[idx].basename = basename;
      configs[idx].origConfig = JSON.stringify(configs[idx].config);
    }
  });

  function newConfig() {
    configs.push({
      uid: uniqueId(),
      filename: '',
      basename: 'New Config File',
      config: [
        normalizeConf({
          title: 'Chat',
          url: 'https://streamlabs.com/widgets/chat-box/v1/YOURSECRETCODE',
          display: 0,
          fullscreen: false,
          coverTaskbar: false,
          xAlign: 'left',
          yAlign: 'center',
          x: 50,
          y: 0,
          width: 450,
          height: 650,
          scale: 0.8,
          opacity: 1,
        }),
        normalizeConf({
          title: 'Alerts',
          url: 'https://streamlabs.com/alert-box/v3/YOURSECRETCODE',
          display: 0,
          fullscreen: false,
          coverTaskbar: false,
          xAlign: 'center',
          yAlign: 'top',
          x: 0,
          y: 20,
          width: 600,
          height: 600,
          scale: 1,
          opacity: 1,
        }),
      ],
    });
    configs = configs;
    activeIndex = configs.length - 1;
  }

  function handleTabClick(event: MouseEvent, index: number) {
    if (event.button === 0) {
      activeIndex = index;
    } else if (event.button === 1) {
      handleTabCloseClick(event, index);
    }
  }

  function handleTabCloseClick(
    event: MouseEvent | KeyboardEvent,
    index: number,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const config = configs[index];
    if (config.origConfig !== JSON.stringify(config.config)) {
      if (
        !confirm(
          'There are unsaved changes that will be lost if you close this file. Are you sure you want to close it and lose these changes?',
        )
      ) {
        return;
      }
    }

    configs.splice(index, 1);
    if (activeIndex === index) {
      activeIndex = Math.min(index, Math.max(configs.length - 1, 0));
    }
  }
</script>

<style>
  .editor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.25rem 1.5rem 0;
    gap: 0.9rem;
  }

  .app-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.7rem;
    background-color: var(--so-accent);
    color: #fff;
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.03em;
  }

  .brand-title {
    font-weight: 600;
    line-height: 1.1;
  }

  .brand-subtitle {
    font-size: 0.8rem;
    color: var(--bs-secondary-color);
  }

  .buttons {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--so-border);
    border-radius: var(--so-radius);
    background-color: var(--so-surface);
  }

  .startup-switch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    padding-inline-start: 2.5em;
  }

  .startup-switch .form-check-label {
    white-space: nowrap;
  }

  .launch-buttons {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .count-badge {
    display: inline-block;
    min-width: 1.35em;
    margin-inline-start: 0.35em;
    padding: 0.05em 0.4em;
    border-radius: 99px;
    background-color: var(--so-accent);
    color: #fff;
    font-size: 0.75em;
    font-weight: 700;
    line-height: 1.5;
  }

  .notice {
    margin-top: 0.75rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--so-accent);
    border-radius: var(--so-radius-sm);
    background-color: var(--so-accent-soft);
    font-size: 0.9rem;
  }

  .shortcut-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }

  .shortcut-row .form-control {
    max-width: 18rem;
  }

  .hint {
    margin: 0.75rem 0 0;
    font-size: 0.85rem;
    color: var(--bs-secondary-color);
  }

  .tab-container {
    flex-basis: 0;
    flex-grow: 1;
    overflow-y: auto;
    padding-bottom: 1.5rem;
  }

  .unsaved-dot {
    display: inline-block;
    width: 0.45em;
    height: 0.45em;
    margin-inline-start: 0.45em;
    vertical-align: middle;
    border-radius: 50%;
    background-color: var(--so-accent);
  }

  .close-tab {
    display: inline-block;
    vertical-align: middle;
    width: 0.3em;
    height: 0.3em;
    margin-inline-start: 0.6em;
    font-size: 0.9em;
    opacity: 0.5;
  }
  .close-tab:hover {
    opacity: 1;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2.5rem 1rem;
    border: 1px dashed var(--so-border);
    border-radius: var(--so-radius);
    background-color: var(--so-surface);
    text-align: center;
  }

  .empty-state .lead {
    margin: 0;
  }

  .help-panel {
    margin-top: 1.5rem;
    padding: 1.25rem 1.5rem;
    border: 1px solid var(--so-border);
    border-radius: var(--so-radius);
    background-color: var(--so-surface);
  }
</style>
