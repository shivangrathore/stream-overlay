<svelte:head>
  <link rel="stylesheet" href="{assets}/bootstrap.min.css" />
</svelte:head>

<div class="app-shell">
  {@render children?.()}
</div>

<Bootstrap />

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Bootstrap from './_bootstrap.svelte';
  import { assets } from '$app/paths';

  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.setAttribute('data-bs-theme', 'dark');
    }

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (event) => {
        document.body.setAttribute(
          'data-bs-theme',
          event.matches ? 'dark' : 'light',
        );
      });
  }

  let {
    children,
  }: {
    children?: Snippet;
  } = $props();
</script>

<style>
  .app-shell {
    height: 100%;
    width: 100%;
  }

  :global(:root) {
    --so-accent: #7c5cff;
    --so-accent-strong: #6a48f5;
    --so-accent-soft: rgba(124, 92, 255, 0.12);
    --so-radius: 0.85rem;
    --so-radius-sm: 0.55rem;
    --so-surface: #ffffff;
    --so-surface-sunken: #f4f5f9;
    --so-border: rgba(16, 18, 40, 0.1);
    --so-shadow:
      0 1px 2px rgba(16, 18, 40, 0.06), 0 8px 24px rgba(16, 18, 40, 0.07);
    --so-shadow-hover:
      0 2px 4px rgba(16, 18, 40, 0.08), 0 16px 32px rgba(16, 18, 40, 0.12);
  }

  :global([data-bs-theme='dark']) {
    --so-accent: #9b83ff;
    --so-accent-strong: #8468ff;
    --so-accent-soft: rgba(155, 131, 255, 0.16);
    --so-surface: #1b1c25;
    --so-surface-sunken: #14151c;
    --so-border: rgba(255, 255, 255, 0.1);
    --so-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.35);
    --so-shadow-hover:
      0 2px 4px rgba(0, 0, 0, 0.45), 0 16px 32px rgba(0, 0, 0, 0.45);
  }

  :global(html),
  :global(body),
  :global(body > div) {
    width: 100%;
    height: 100%;
    font-family:
      system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      'Helvetica Neue',
      'Noto Sans',
      'Liberation Sans',
      Arial,
      sans-serif,
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Noto Color Emoji';
  }

  :global(body) {
    background-color: var(--so-surface-sunken);
  }

  /* Scrollbars that don't fight the rest of the app. */
  :global(*) {
    scrollbar-width: thin;
    scrollbar-color: var(--so-border) transparent;
  }
  :global(::-webkit-scrollbar) {
    width: 10px;
    height: 10px;
  }
  :global(::-webkit-scrollbar-thumb) {
    background-color: var(--so-border);
    border: 3px solid transparent;
    background-clip: content-box;
    border-radius: 99px;
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background-color: var(--so-accent);
  }

  /* Buttons */
  :global(.btn) {
    --bs-btn-border-radius: var(--so-radius-sm);
    font-weight: 500;
    transition:
      transform 0.08s ease,
      box-shadow 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
  }
  :global(.btn:active) {
    transform: translateY(1px);
  }
  :global(.btn:focus-visible) {
    outline: 2px solid var(--so-accent);
    outline-offset: 2px;
    box-shadow: none;
  }

  :global(.btn-purple) {
    border-color: var(--so-accent) !important;
    background-color: var(--so-accent) !important;
    color: #fff !important;
    box-shadow: 0 4px 12px var(--so-accent-soft);
  }
  :global(.btn-purple:hover),
  :global(.btn-purple:focus) {
    border-color: var(--so-accent-strong) !important;
    background-color: var(--so-accent-strong) !important;
  }

  :global(.btn-secondary) {
    --bs-btn-bg: transparent;
    --bs-btn-border-color: var(--so-border);
    --bs-btn-color: var(--bs-body-color);
    --bs-btn-hover-bg: var(--so-accent-soft);
    --bs-btn-hover-border-color: var(--so-accent);
    --bs-btn-hover-color: var(--bs-body-color);
    --bs-btn-active-bg: var(--so-accent-soft);
    --bs-btn-active-border-color: var(--so-accent);
    --bs-btn-active-color: var(--bs-body-color);
    --bs-btn-disabled-bg: transparent;
    --bs-btn-disabled-border-color: var(--so-border);
  }

  /* Cards */
  :global(.card) {
    --bs-card-border-radius: var(--so-radius);
    --bs-card-inner-border-radius: var(--so-radius);
    --bs-card-border-color: var(--so-border);
    --bs-card-bg: var(--so-surface);
    box-shadow: var(--so-shadow);
    transition:
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }
  :global(.card:hover) {
    box-shadow: var(--so-shadow-hover);
  }
  :global(.card-header) {
    background-color: transparent;
    border-bottom-color: var(--so-border);
    padding-block: 0.75rem;
  }

  /* Form controls */
  :global(.form-control),
  :global(.form-select),
  :global(.input-group-text) {
    border-radius: var(--so-radius-sm);
    border-color: var(--so-border);
  }
  :global(.form-control:focus),
  :global(.form-select:focus) {
    border-color: var(--so-accent);
    box-shadow: 0 0 0 3px var(--so-accent-soft);
  }
  :global(.form-check-input:checked) {
    background-color: var(--so-accent);
    border-color: var(--so-accent);
  }
  :global(.form-check-input:focus) {
    border-color: var(--so-accent);
    box-shadow: 0 0 0 3px var(--so-accent-soft);
  }
  :global(.form-range::-webkit-slider-thumb) {
    background-color: var(--so-accent);
  }
  :global(.form-label),
  :global(.section-label) {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--bs-secondary-color);
    margin-bottom: 0.35rem;
  }

  /* Tabs, rendered as pills. */
  :global(.nav-tabs) {
    border-bottom: none;
    gap: 0.35rem;
  }
  :global(.nav-tabs .nav-link) {
    border: 1px solid transparent !important;
    border-radius: 99px !important;
    color: var(--bs-secondary-color);
    padding: 0.35rem 0.9rem;
  }
  :global(.nav-tabs .nav-link:hover) {
    background-color: var(--so-accent-soft);
    color: var(--bs-body-color);
  }
  :global(.nav-tabs .nav-link.active) {
    background-color: var(--so-accent-soft) !important;
    border-color: var(--so-accent) !important;
    color: var(--bs-body-color) !important;
  }

  :global(.dropdown-menu) {
    border-radius: var(--so-radius-sm);
    border-color: var(--so-border);
    box-shadow: var(--so-shadow);
  }
</style>
