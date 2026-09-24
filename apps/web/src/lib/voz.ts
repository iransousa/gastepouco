/**
 * Ler em voz alta (docs/08-ACESSIBILIDADE.md).
 *
 * `speechSynthesis` não existe em todo navegador e, quando existe, a lista de
 * vozes às vezes só chega depois de um evento — por isso escolhemos uma voz
 * pt-BR se houver e seguimos sem ela se não houver, em vez de esperar.
 *
 * Nunca falar duas coisas ao mesmo tempo: cancelamos o que estava na fila.
 */
export function falar(texto: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = 'pt-BR';
  fala.rate = 0.95; // um pouco mais devagar: o público inclui quem ouve mal

  const vozPtBr = window.speechSynthesis
    .getVoices()
    .find((voz) => voz.lang.toLowerCase().startsWith('pt'));
  if (vozPtBr) fala.voice = vozPtBr;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(fala);
}

export function pararDeFalar(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}
