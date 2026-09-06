<div class="app-shell">
  {@render children?.()}
</div>

<Bootstrap />

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Bootstrap from './_bootstrap.svelte';

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
    --so-accent: #6d4aff;
    --so-accent-strong: #5a35f0;
    --so-accent-soft: rgba(109, 74, 255, 0.1);
    --so-good: #2ea86b;
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
    --so-accent: #9d86ff;
    --so-accent-strong: #b1a0ff;
    --so-accent-soft: rgba(157, 134, 255, 0.14);
    --so-good: #3ddc97;
    --so-surface: #1a1b23;
    --so-surface-sunken: #101117;
    --so-border: rgba(255, 255, 255, 0.08);
    --bs-body-color: #e7e7ee;
    --bs-secondary-color: #9a9aad;
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
    --bs-btn-bg: transparent !important;
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
    --bs-btn-disabled-color: var(--bs-secondary-color);
  }

  :global(.btn-secondary.active),
  :global(.btn-secondary[aria-pressed='true']) {
    --bs-btn-bg: var(--so-accent-soft) !important;
    --bs-btn-border-color: var(--so-accent);
    --bs-btn-color: var(--bs-body-color);
  }

  :global(.btn-check:focus + .btn),
  :global(.btn:focus) {
    box-shadow: none;
  }

  /* Inputs sit on the sunken tone, so fields read as fields in both themes. */
  :global(.form-control),
  :global(.form-select) {
    background-color: var(--so-surface-sunken);
  }
  :global(.form-control:focus),
  :global(.form-select:focus) {
    background-color: var(--so-surface-sunken);
  }
  :global(.input-group-text) {
    background-color: var(--so-surface-sunken);
    color: var(--bs-secondary-color);
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
  :global(.form-range) {
    accent-color: var(--so-accent);
  }
  :global(.form-range::-webkit-slider-thumb) {
    background-color: var(--so-accent);
  }
  :global(.form-range::-moz-range-thumb) {
    background-color: var(--so-accent);
    border-color: var(--so-accent);
  }
  :global(.form-range::-webkit-slider-runnable-track) {
    background-color: var(--so-border);
  }
  :global(.form-label) {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--bs-secondary-color);
    margin-bottom: 0.25rem;
  }

  :global(.section-label) {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--bs-secondary-color);
    margin-bottom: 0.4rem;
  }

  :global(.form-control-sm),
  :global(.form-select-sm) {
    font-size: 0.85rem;
  }

  /* Tabs, rendered as pills. */
  :global(.nav-tabs) {
    border-bottom: none !important;
    gap: 0.3rem;
  }
  :global(.nav-tabs .nav-link) {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    border: 1px solid transparent !important;
    border-radius: 99px !important;
    color: var(--bs-secondary-color);
    padding: 0.3rem 0.5rem 0.3rem 0.85rem;
    font-size: 0.88rem;
    margin-bottom: 0 !important;
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
