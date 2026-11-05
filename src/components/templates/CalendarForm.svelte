<script lang="ts">
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import { toDateOnly, toDateTime } from '../../lib/templates/calendar';
  import Checkbox from '../fields/Checkbox.svelte';
  import TextField from '../fields/TextField.svelte';
  import { fieldError } from './field-error';

  const v = $derived(app.values.calendar);

  /** Converts start/end between date and date-time when all-day is toggled. */
  function setAllDay(allDay: boolean) {
    const c = app.values.calendar;
    c.allDay = allDay;
    c.start = allDay ? toDateOnly(c.start) : toDateTime(c.start);
    c.end = allDay ? toDateOnly(c.end) : toDateTime(c.end);
  }
</script>

<TextField id="calendar-title" label={t('calendar.title')} bind:value={app.values.calendar.title} />

<Checkbox label={t('calendar.allDay')} bind:checked={() => v.allDay, setAllDay} />

<div class="row">
  <TextField
    id="calendar-start"
    label={t('calendar.start')}
    type={v.allDay ? 'date' : 'datetime-local'}
    bind:value={app.values.calendar.start}
    error={fieldError('start')}
  />
  <TextField
    id="calendar-end"
    label={t('calendar.end')}
    type={v.allDay ? 'date' : 'datetime-local'}
    bind:value={app.values.calendar.end}
    error={fieldError('end')}
  />
</div>

<TextField
  id="calendar-location"
  label={t('calendar.location')}
  bind:value={app.values.calendar.location}
/>
<TextField
  id="calendar-description"
  label={t('calendar.description')}
  multiline
  rows={3}
  bind:value={app.values.calendar.description}
/>

<style>
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  @media (max-width: 420px) {
    .row {
      grid-template-columns: 1fr;
    }
  }
</style>
