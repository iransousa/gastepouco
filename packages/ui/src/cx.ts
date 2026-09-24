/** Junta classes ignorando falsos. Mesmo comportamento do bundle de referência. */
export function cx(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ');
}
