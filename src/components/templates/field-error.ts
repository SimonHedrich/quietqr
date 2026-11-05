import { app } from '../../lib/state/app.svelte';
import { t } from '../../lib/state/prefs.svelte';

/** The translated validation message for a field of the active template, if any. */
export function fieldError(field: string): string | undefined {
  const error = app.errors.find((e) => e.field === field);
  return error && t(`error.${error.key}`);
}
