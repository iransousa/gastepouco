import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, IconButton, PointsBadge, TextField } from '@gastemenos/ui';
import { TelaDeAcesso } from '../../componentes/TelaDeAcesso.js';
import { Erro } from '../../componentes/Erro.js';
import { ErroDaApi, api } from '../../lib/api.js';

/**
 * `referencia/telas/CriarConta.dc.html`
 *
 * O botão só libera com os termos aceitos, e diz por que está bloqueado
 * ("Aceite os termos para continuar") em vez de ficar cinza em silêncio.
 * O aceite é gravado em `Consent` pela API — é a prova do consentimento
 * (docs/09-SEGURANCA-LGPD.md).
 */

/** Medidor de senha. Só orienta; quem decide se passa é a regra da API. */
function forcaDaSenha(senha: string): { nivel: 0 | 1 | 2 | 3; texto: string } {
  if (senha.length < 8) return { nivel: 0, texto: 'Use pelo menos 8 caracteres.' };

  const temMaiuscula = /[A-Z]/.test(senha);
  const temNumero = /\d/.test(senha);
  const temSimbolo = /[^A-Za-z0-9]/.test(senha);

  if (!temMaiuscula || !temNumero) {
    return { nivel: 1, texto: 'Falta uma letra maiúscula e um número.' };
  }
  if (!temSimbolo) return { nivel: 2, texto: 'Senha boa. Um símbolo deixaria mais forte.' };
  return { nivel: 3, texto: 'Senha forte.' };
}

export function CriarConta(): React.ReactElement {
  const navegar = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [cep, setCep] = useState('');
  const [aceitou, setAceitou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const forca = forcaDaSenha(senha);

  async function enviar(evento: React.FormEvent): Promise<void> {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      await api.post('/auth/register', {
        name: nome,
        email,
        password: senha,
        cep: cep || undefined,
        acceptTerms: aceitou,
      });
      navegar('/confirmar-email', { state: { email } });
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        // A API devolve a lista campo a campo em VALIDATION_FAILED; mostrar a
        // primeira é mais útil do que a frase genérica.
        setErro(falha.detalhes?.[0] ?? falha.paraOUsuario);
      } else {
        setErro('Não foi possível criar a conta.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaDeAcesso
      acimaDoTitulo={
        <div className="mb-6">
          <PointsBadge points={50} size="l" />
          <span className="ml-2 text-body-s text-ink-muted">de boas-vindas</span>
        </div>
      }
      titulo="Crie sua conta"
      descricao="Leva menos de um minuto."
    >
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="secondary" fullWidth href="/entrar/google">
          Google
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-caption text-ink-muted">ou com e-mail</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={enviar} className="mt-6 flex flex-col gap-4" noValidate>
        <TextField
          label="Como podemos te chamar?"
          autoComplete="name"
          required
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
        />

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />

        <TextField
          label="Senha"
          type={mostrarSenha ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={senha}
          hint={senha ? forca.texto : 'Pelo menos 8 caracteres, um número e uma maiúscula.'}
          onChange={(evento) => setSenha(evento.target.value)}
          trailing={
            <IconButton
              icon={mostrarSenha ? 'eyeOff' : 'eye'}
              label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
              onClick={() => setMostrarSenha((atual) => !atual)}
            />
          }
        />

        {/* A força também precisa aparecer sem depender da cor da barra. */}
        <div
          role="img"
          aria-label={senha ? `Força da senha: ${forca.texto}` : 'Senha ainda não preenchida'}
          className="flex gap-1"
        >
          {[1, 2, 3].map((marca) => (
            <span
              key={marca}
              className={`h-1.5 flex-1 rounded-pill ${
                forca.nivel >= marca ? 'bg-brand' : 'bg-line'
              }`}
            />
          ))}
        </div>

        <TextField
          label="CEP de onde você faz compras"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={9}
          value={cep}
          hint="Usamos para mostrar preços e ofertas da sua região."
          onChange={(evento) => setCep(evento.target.value)}
        />

        <Card tone="sunken" as="div">
          <label className="flex items-start gap-3 text-body-s text-ink">
            <input
              type="checkbox"
              checked={aceitou}
              onChange={(evento) => setAceitou(evento.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
            />
            <span>
              Li e aceito os{' '}
              <Link to="/termos" className="text-brand underline">
                Termos de uso
              </Link>{' '}
              e a{' '}
              <Link to="/privacidade" className="text-brand underline">
                Política de privacidade
              </Link>
              . Minhas notas ajudam a comunidade de forma anônima.
            </span>
          </label>
        </Card>

        <Erro mensagem={erro} />

        <Button type="submit" fullWidth disabled={!aceitou || enviando}>
          {enviando ? 'Criando…' : 'Criar conta'}
        </Button>

        {/* Diz por que está bloqueado: botão cinza sem explicação prende a pessoa. */}
        {!aceitou ? (
          <p className="text-center text-caption text-ink-muted">
            Aceite os termos para continuar
          </p>
        ) : null}
      </form>

      <p className="mt-8 text-center text-body-s text-ink-muted">
        Já tem conta?{' '}
        <Link to="/entrar" className="text-brand underline">
          Entrar
        </Link>
      </p>
    </TelaDeAcesso>
  );
}
