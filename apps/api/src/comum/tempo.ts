/** O app inteiro raciocina em Brasília; o banco guarda UTC. */
export const FUSO = 'America/Sao_Paulo';

export function emMinutos(minutos: number): Date {
  return new Date(Date.now() + minutos * 60_000);
}

export function emDias(dias: number): Date {
  return new Date(Date.now() + dias * 24 * 60 * 60_000);
}

export function expirou(quando: Date | null | undefined): boolean {
  return !quando || quando.getTime() < Date.now();
}

/** "2026-09" — chave de mês usada em ranking, agregados e resumo de gastos. */
export function chaveDoMes(data = new Date()): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}
