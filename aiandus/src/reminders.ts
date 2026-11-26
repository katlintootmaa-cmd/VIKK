import type { Entry } from './journal';
import type { Crop } from './calendar';

export const remindersAvailable = false;

export async function enableReminders(): Promise<boolean> {
  return false;
}

export async function syncReminders(_entries: Entry[], _crops: Crop[]): Promise<void> {
  // The web preview stores plans locally. Phone notifications run in the native app.
}
