# Fixtures da NFC-e do DF

## Leia antes de confiar nestes testes

`nota-sintetica.html` **não é uma captura real**. Ele reproduz a estrutura do
modelo padrão de consulta da SEFAZ (`#tabResult`, `.txtTit`, `.Rqtd`, `.RUN`,
`.RvlUnit`, `.valor`, `#totalNota`), que é o que o portal do DF usa, mas foi
escrito à mão.

Isso importa: um parser testado só contra uma fixture que o próprio autor
escreveu está testando as suas suposições, não a página. Ele prova que o parser
é consistente, não que ele lê o DF.

**Antes de habilitar o DF em produção**, substitua por capturas reais:

1. Compre qualquer coisa numa loja do DF e leia o QR code da nota.
2. Abra a URL do QR no navegador e salve a página (`Ctrl+S`, "somente HTML").
3. **Remova o CPF do consumidor** do arquivo antes de commitar — a página traz
   o CPF quando ele foi informado na compra, e ele não pode entrar no
   repositório (docs/09-SEGURANCA-LGPD.md, "Minimização").
4. Salve como `real-<algo-que-identifique>.html` e acrescente um caso em
   `nfce.parser.spec.ts` com os valores conferidos na nota de papel.

Capturas úteis para ter, porque são onde os parsers quebram:

- nota com item vendido por peso (0,638 kg), que exerce a quantidade decimal
- nota com mais de 40 itens, que costuma paginar
- nota com desconto no total
- nota com CPF informado, para conferir que ele não sai no resultado
- a página que o portal devolve quando pede captcha, para o caso `NEEDS_QR`
