<svelte:head>
  <title>Config Editor - Stream Overlay</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="editor-container">
  <header class="app-bar">
    <div class="brand">
      <span class="brand-mark">SO</span>
      <span class="brand-title">Stream Overlay</span>
    </div>

    <ul class="nav nav-tabs tab-strip">
      {#each configs as entry, i}
        <li class="nav-item">
          <button
            class="nav-link"
            class:active={activeIndex === i}
            aria-current="page"
            title={entry.filename || 'Not saved yet'}
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
      <li class="nav-item">
        <button
          class="nav-link new-tab"
          title="New config file (Ctrl+N)"
          onclick={newConfig}>+</button
        >
      </li>
    </ul>

    <div class="bar-actions">
      {#if activeConfig}
        <button
          class="btn btn-sm btn-secondary"
          disabled={activeConfig.filename === '' || !unsaved}
          title="Save (Ctrl+S)"
          onclick={save}>Save</button
        >
        <button
          class="btn btn-sm btn-secondary"
          title="Save as (Ctrl+Shift+S)"
          onclick={saveAs}>Save As</button
        >
      {/if}
      <button
        class="btn btn-sm btn-secondary"
        title="Open (Ctrl+O)"
        onclick={() => electronAPI.requestConfigFile()}>Open</button
      >

      <div class="dropdown">
        <button
          class="btn btn-sm btn-secondary dropdown-toggle"
          type="button"
          id="settingsMenu"
          data-bs-toggle="dropdown"
          data-bs-auto-close="outside"
          aria-expanded="false">Settings</button
        >
        <div
          class="dropdown-menu dropdown-menu-end settings-menu"
          aria-labelledby="settingsMenu"
        >
          <div class="setting">
            <div class="form-check form-switch">
              <input
                type="checkbox"
                role="switch"
                class="form-check-input"
                id="startupConfig"
                disabled={!activeConfig || activeConfig.filename === ''}
                checked={isStartupConfig}
                onchange={toggleStartupConfig}
              />
              <label for="startupConfig" class="form-check-label"
                >Launch this config at startup</label
              >
            </div>
            <small class="text-muted"
              >{activeConfig && activeConfig.filename === ''
                ? 'Save the config file first.'
                : 'Its overlays open by themselves when the app starts.'}</small
            >
          </div>

          <div class="setting">
            <label for="editShortcut" class="form-label"
              >Edit mode shortcut</label
            >
            <div class="setting-row">
              <input
                type="text"
                class="form-control form-control-sm"
                class:recording
                id="editShortcut"
                readonly
                placeholder="Not set"
                value={recording ? 'Press the keys…' : shortcut || ''}
                onfocus={() => (recording = true)}
                onblur={() => (recording = false)}
                onkeydown={recordShortcut}
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
            <small class="text-muted"
              >Click the box and press the keys. Needs a modifier.</small
            >
          </div>

          <div class="setting">
            <button
              class="btn btn-sm btn-secondary w-100"
              onclick={() => electronAPI.requestHelp()}>Help</button
            >
          </div>
        </div>
      </div>
    </div>
  </header>

  {#if fullscreenApp}
    <div class="notice">
      <strong>A fullscreen app is covering your overlays.</strong> Windows hides
      every overlay while a game runs in exclusive fullscreen. Switch the game to
      borderless, or leave Fullscreen Optimizations on for it.
    </div>
  {/if}

  <div class="workspace-container">
    {#key activeIndex}
      {#if activeConfig}
        <ConfigEditor
          bind:config={activeConfig.config}
          uid={activeConfig.uid || ''}
          {displays}
          {running}
        />
      {:else}
        <div class="empty-state">
          <div class="empty-card">
            <h5>No config file open</h5>
            <p class="text-muted">
              Create one, or open a config file you've already saved.
            </p>
            <div class="empty-actions">
              <button class="btn btn-purple" onclick={newConfig}
                >New Config File</button
              >
              <button
                class="btn btn-secondary"
                onclick={() => electronAPI.requestConfigFile()}>Open…</button
              >
            </div>
          </div>

          <div class="help-panel">
            <Help />
          </div>
        </div>
      {/if}
    {/key}
  </div>

  <footer class="status-bar">
    <div class="status-left">
      <span class="status-item">
        <span class="state-dot" class:running={overlayCount > 0}></span>
        {overlayCount}
        {overlayCount === 1 ? 'overlay' : 'overlays'} open
      </span>
      {#if activeConfig}
        <span class="status-item text-muted"
          >{unsaved ? 'Unsaved changes' : 'Saved'}</span
        >
      {/if}
    </div>

    <div class="status-right">
      <button
        class="btn btn-sm btn-secondary"
        class:active={editMode}
        aria-pressed={editMode}
        disabled={overlayCount === 0}
        title="Make every overlay clickable, so they can be dragged."
        onclick={toggleEditMode}
        >Edit Mode{#if settings.editModeShortcut}<span class="key-hint"
            >{settings.editModeShortcut}</span
          >{/if}</button
      >
      <button
        class="btn btn-sm btn-secondary"
        disabled={overlayCount === 0}
        onclick={() => electronAPI.requestCloseAll()}>Close All</button
      >
      {#if activeConfig}
        <div class="dropdown dropup">
          <button
            class="btn btn-sm btn-purple dropdown-toggle"
            type="button"
            id="launchDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false">Launch All</button
          >
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
              <button class="dropdown-item" onclick={() => launchAll('normal')}
                >Click-Through</button
              >
            </li>
          </ul>
        </div>
      {/if}
    </div>
  </footer>
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
  let unsaved = $derived(
    !!activeConfig &&
      JSON.stringify(activeConfig.config) !== activeConfig.origConfig,
  );
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
  let fullscreenApp = $state(false);

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

  electronAPI.fullscreenApp((_event, data) => {
    fullscreenApp = data.fullscreenApp;
  });

  electronAPI.displays((_event, data) => {
    displays = data;
  });
  electronAPI.requestDisplays();

  // Push edits to the window a config entry is already running in, so the
  // overlay follows the editor. The state last exchanged with each window is
  // remembered, so an edit isn't echoed back and forth.
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

  let recording = $state(false);

  // Electron accelerators for the keys that aren't just their own name.
  const KEY_NAMES: { [key: string]: string } = {
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    ' ': 'Space',
    Escape: 'Esc',
    '+': 'Plus',
  };

  function recordShortcut(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'Escape') {
      (event.currentTarget as HTMLInputElement).blur();
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      shortcut = '';
      saveShortcut();
      (event.currentTarget as HTMLInputElement).blur();
      return;
    }

    // Wait for a key to go with the modifiers.
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      return;
    }

    const modifiers = [
      ...(event.ctrlKey ? ['Control'] : []),
      ...(event.altKey ? ['Alt'] : []),
      ...(event.shiftKey ? ['Shift'] : []),
      ...(event.metaKey ? ['Super'] : []),
    ];

    if (!modifiers.length) {
      // Without one, the shortcut would swallow that key everywhere.
      return;
    }

    const key =
      KEY_NAMES[event.key] ??
      (event.key.length === 1 ? event.key.toUpperCase() : event.key);

    shortcut = [...modifiers, key].join('+');
    saveShortcut();
    (event.currentTarget as HTMLInputElement).blur();
  }

  function saveShortcut() {
    electronAPI.requestSetShortcut({ accelerator: shortcut.trim() || null });
  }

  function toggleEditMode() {
    electronAPI.requestEditMode({ editMode: !editMode });
  }

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

  function save() {
    if (!activeConfig || activeConfig.filename === '') {
      saveAs();
      return;
    }

    electronAPI.requestSave({
      config: $state.snapshot(activeConfig.config),
      filename: activeConfig.filename,
      uid: activeConfig.uid || '',
    });
  }

  function saveAs() {
    if (!activeConfig) {
      return;
    }

    electronAPI.requestSaveAs({
      config: $state.snapshot(activeConfig.config),
      uid: activeConfig.uid || '',
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 's':
        event.preventDefault();
        event.shiftKey ? saveAs() : save();
        break;
      case 'o':
        event.preventDefault();
        electronAPI.requestConfigFile();
        break;
      case 'n':
        event.preventDefault();
        newConfig();
        break;
      case 'w':
        event.preventDefault();
        if (configs.length) {
          handleTabCloseClick(event, activeIndex);
        }
        break;
    }
  }

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
    min-height: 0;
    padding: 0.75rem 0.9rem;
    gap: 0.65rem;
  }

  .app-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: none;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 0.55rem;
    background-color: var(--so-accent);
    color: #fff;
    font-weight: 700;
    font-size: 0.72rem;
  }

  .brand-title {
    font-weight: 600;
    font-size: 0.95rem;
    white-space: nowrap;
  }

  .tab-strip {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    flex-wrap: nowrap;
    white-space: nowrap;
    overflow-y: hidden;
  }

  .new-tab {
    padding-inline: 0.7rem;
    font-weight: 600;
  }

  .bar-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex: none;
  }

  .settings-menu {
    width: min(20rem, calc(100vw - 2rem));
    padding: 0.75rem;
  }

  .setting + .setting {
    margin-top: 0.9rem;
    padding-top: 0.9rem;
    border-top: 1px solid var(--so-border);
  }

  .setting-row {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }

  .setting-row .form-control.recording {
    border-color: var(--so-accent);
    box-shadow: 0 0 0 3px var(--so-accent-soft);
  }

  .workspace-container {
    flex: 1;
    min-height: 0;
  }

  .notice {
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--so-accent);
    border-radius: var(--so-radius-sm);
    background-color: var(--so-accent-soft);
    font-size: 0.88rem;
  }

  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
    flex: none;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--so-border);
    border-radius: var(--so-radius);
    background-color: var(--so-surface);
    font-size: 0.85rem;
  }

  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--bs-secondary-color);
  }

  .state-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--so-border);
  }
  .state-dot.running {
    background-color: #2ec27e;
  }

  .key-hint {
    margin-inline-start: 0.4rem;
    padding: 0.05rem 0.35rem;
    border: 1px solid var(--so-border);
    border-radius: 0.35rem;
    font-size: 0.72em;
    color: var(--bs-secondary-color);
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
    height: 100%;
    overflow-y: auto;
  }

  .empty-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 2rem 1rem;
    border: 1px dashed var(--so-border);
    border-radius: var(--so-radius);
    background-color: var(--so-surface);
    text-align: center;
  }

  .empty-card p {
    margin: 0;
  }

  .empty-actions {
    display: flex;
    gap: 0.6rem;
  }

  /* The bar gives up the brand, then the tab row, as space runs out. */
  @media (max-width: 900px) {
    .brand-title {
      display: none;
    }
  }

  @media (max-width: 760px) {
    .editor-container {
      padding: 0.5rem 0.55rem;
      gap: 0.5rem;
    }
    .tab-strip {
      order: 3;
      flex-basis: 100%;
    }
    .bar-actions {
      margin-inline-start: auto;
    }
    .status-bar {
      font-size: 0.8rem;
    }
  }

  .help-panel {
    margin-top: 1rem;
    padding: 1.25rem 1.5rem;
    border: 1px solid var(--so-border);
    border-radius: var(--so-radius);
    background-color: var(--so-surface);
  }
</style>
