import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Icon } from '@gastemenos/ui';
import { TelaDeAcesso } from '../../componentes/TelaDeAcesso.js';

/**
 * `referencia/telas/GoogleLogin.dc.html`
 *
 * Tela **do GasteMenos**, não uma imitação da do Google — a nota do protótipo é
 * explícita sobre isso. Imitar a tela de um provedor é a forma clássica de
 * phishing; mesmo com boa intenção, ensina a pessoa a digitar a senha do Google
 * em telas que parecem do Google.
 *
 * Ela diz o que o app recebe **antes** de mandar para o Google, para o
 * consentimento ser informado (docs/09-SEGURANCA-LGPD.md).
 */
export function EntrarComGoogle(): React.ReactElement {
  const navegar = useNavigate();

  function continuar(): void {
    // O fluxo OAuth acontece no servidor: a API monta a URL com PKCE e `state`
    // e devolve a sessão em cookie ao voltar. O web só manda o navegador para lá.
    window.location.href = '/v1/auth/google';
  }

  return (
    <TelaDeAcesso
      acimaDoTitulo={
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-m bg-surface-sunken text-ink">
            <Icon name="user" size={22} />
          </span>
          <span className="text-title-s text-ink">Google</span>
        </div>
      }
      titulo="Entrar com sua conta Google"
      descricao="Sem senha nova para lembrar. Você pode desconectar quando quiser."
      rodape={
        <>
          <Button fullWidth onClick={continuar}>
            Continuar com o Google
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navegar('/entrar')}>
            Usar outra conta
          </Button>
        </>
      }
    >
      <Card className="mt-8 gap-3">
        <h2 className="text-title-s text-ink">O GasteMenos vai receber</h2>
        <ul className="flex flex-col gap-2 text-body-m text-ink">
          <li className="flex items-center gap-2">
            <Icon name="check" size={18} />
            Seu nome e foto de perfil
          </li>
          <li className="flex items-center gap-2">
            <Icon name="check" size={18} />
            Seu endereço de e-mail
          </li>
        </ul>
        <p className="text-body-s text-ink-muted">
          Não temos acesso à sua senha, e-mails ou arquivos.
        </p>
      </Card>

      <p className="mt-6 text-caption text-ink-muted">
        Ao continuar, você aceita os{' '}
        <Link to="/termos" className="text-brand underline">
          Termos de uso
        </Link>{' '}
        e a{' '}
        <Link to="/privacidade" className="text-brand underline">
          Política de privacidade
        </Link>
        .
      </p>
    </TelaDeAcesso>
  );
}
