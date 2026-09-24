import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@gastemenos/ui';
import { TelaDeAcesso } from '../../componentes/TelaDeAcesso.js';
import { Erro } from '../../componentes/Erro.js';
import { api } from '../../lib/api.js';
import { useSessao, type Usuario } from '../../app/sessao.js';

/**
 * `referencia/telas/VerificarEmail.dc.html`
 *
 * O campo é um `input` só, com 6 dígitos, e não seis caixinhas separadas.
 * Seis campos quebram o preenchimento automático do celular, atrapalham o
 * leitor de tela e tornam a correção de um dígito um pequeno inferno para quem
 * tem pouca firmeza no toque. `autoComplete="one-time-code"` faz o iOS e o
 * Android oferecerem o código direto da notificação do e-mail.
 */

const SEGUNDOS_PARA_REENVIAR = 60;

export function ConfirmarEmail(): React.ReactElement {
  const navegar = useNavigate();
  const local = useLocation();
  const { entrarComTokens } = useSessao();

  const email = (local.state as { email?: string } | null)?.email ?? '';

  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [segundos, setSegundos] = useState(SEGUNDOS_PARA_REENVIAR);
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (segundos <= 0) return;
    const marcador = setTimeout(() => setSegundos((atual) => atual - 1), 1000);
    return () => clearTimeout(marcador);
  }, [segundos]);

  useEffect(() => {
    campoRef.current?.focus();
  }, []);

  async function confirmar(evento: React.FormEvent): Promise<void> {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await api.post<{ access: string; user: Usuario }>('/auth/verify-email', {
        email,
        code: codigo,
      });
      entrarComTokens(resposta.access, resposta.user);
      // Quem acabou de confirmar ainda não respondeu o perfil de consumo.
      navegar('/perfil-de-consumo', { replace: true });
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível confirmar.');
    } finally {
      setEnviando(false);
    }
  }

  async function reenviar(): Promise<void> {
    setErro(null);
    try {
      await api.post('/auth/resend-code', { email });
      setSegundos(SEGUNDOS_PARA_REENVIAR);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível reenviar.');
    }
  }

  const relogio = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;

  return (
    <TelaDeAcesso
      titulo="Confirme seu e-mail"
      descricao={
        <>
          Enviamos um código de 6 números para <strong className="text-ink">{email}</strong>.{' '}
          <Link to="/criar-conta" className="text-brand underline">
            Alterar e-mail
          </Link>
        </>
      }
    >
      <form onSubmit={confirmar} className="mt-8 flex flex-col gap-4" noValidate>
        <label htmlFor="codigo" className="text-label text-ink">
          Código de verificação
        </label>
        <input
          ref={campoRef}
          id="codigo"
          name="codigo"
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          aria-describedby="codigo-ajuda"
          className="min-h-field rounded-m border-[1.5px] border-line-strong bg-surface-raised px-4 text-center text-title-l tracking-[0.3em] text-ink"
        />

        <p id="codigo-ajuda" className="text-body-s text-ink-muted">
          Não chegou? Veja o spam ou{' '}
          {segundos > 0 ? (
            <span>
              reenvie em <span className="tabular-nums">{relogio}</span>
            </span>
          ) : (
            <button type="button" onClick={reenviar} className="text-brand underline">
              reenvie agora
            </button>
          )}
        </p>

        <Erro mensagem={erro} />

        <Button type="submit" fullWidth disabled={codigo.length !== 6 || enviando}>
          {enviando ? 'Confirmando…' : 'Confirmar'}
        </Button>
      </form>
    </TelaDeAcesso>
  );
}
