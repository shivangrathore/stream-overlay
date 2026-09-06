<div class="value-editor">
  {#if valuePercent}
    <input
      type="text"
      class="form-control"
      data-bs-theme="light"
      id="value{i}"
      bind:value
      placeholder="15.0%"
      pattern={allowNegative ? '^-?\\d+(\\.\\d+)?%$' : '^\\d+(\\.\\d+)?%$'}
      onchange={() =>
        (value =
          (isNaN(parseFloat(`${value}`)) ? '0' : parseFloat(`${value}`)) + '%')}
    />
  {:else}
    <input
      type="number"
      class="form-control"
      data-bs-theme="light"
      id="value{i}"
      min={allowNegative ? undefined : 0}
      bind:value
    />
  {/if}

  <div
    class="btn-group btn-group-sm unit-toggle"
    role="group"
    aria-label="Unit"
  >
    <button
      type="button"
      class="btn"
      class:btn-purple={!valuePercent}
      class:btn-secondary={valuePercent}
      aria-pressed={!valuePercent}
      title="Pixels"
      onclick={() => (value = 0)}>px</button
    >
    <button
      type="button"
      class="btn"
      class:btn-purple={valuePercent}
      class:btn-secondary={!valuePercent}
      aria-pressed={valuePercent}
      title="Percent of the display"
      onclick={() => (value = '0%')}>%</button
    >
  </div>
</div>

<script lang="ts" module>
  let counter = 0;
</script>

<script lang="ts">
  let {
    value = $bindable(0),
    allowNegative = false,
  }: {
    value?: number | string;
    allowNegative?: boolean;
  } = $props();

  let valuePercent = $derived(typeof value === 'string');

  let i = counter++;
</script>

<style>
  .value-editor {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .value-editor :global(.form-control) {
    min-width: 0;
  }

  .unit-toggle {
    flex: none;
  }

  .unit-toggle .btn {
    --bs-btn-padding-x: 0.6rem;
    font-variant-numeric: tabular-nums;
  }
</style>
