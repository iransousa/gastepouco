/**
 * Mensagem de erro do formulário.
 *
 * `role="alert"` para o leitor de tela anunciar assim que aparece, e o texto
 * vem da API — nenhuma tela inventa frase de erro (CLAUDE.md).
 */
export function Erro({ mensagem }: { mensagem?: string | null }): React.ReactElement | null {
  if (!mensagem) return null;
  return (
    <p role="alert" className="mt-4 rounded-m bg-offer-soft px-4 py-3 text-body-s text-offer-ink">
      {mensagem}
    </p>
  );
}
