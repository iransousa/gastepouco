import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Preferências: aparência, acessibilidade, notificações e privacidade.
 *
 * Ficam no servidor, não no aparelho, por um motivo de acessibilidade: quem
 * configurou letra "Muito grande" e alto contraste no celular não pode ter que
 * refazer isso ao abrir no computador. O app guarda uma cópia local só para
 * aplicar antes do primeiro desenho; a verdade é esta tabela.
 *
 * Os padrões seguem docs/09-SEGURANCA-LGPD.md: **compartilhar com parceiros e
 * ofertas patrocinadas por notificação começam desligados**. Consentimento é
 * ato de escolher, não de esquecer de desmarcar.
 */

export interface MudancaDePreferencias {
  theme?: 'SYSTEM' | 'LIGHT' | 'DARK' | 'CONTRAST';
  textSize?: 'NORMAL' | 'GRANDE' | 'MUITO_GRANDE';
  highContrast?: boolean;
  easyMode?: boolean;
  readAloud?: boolean;
  reduceMotion?: boolean;
  vibrate?: boolean;
  quietStart?: string;
  quietEnd?: string;
  notifyPriceDrop?: boolean;
  notifyListOffer?: boolean;
  notifyReminder?: boolean;
  notifyRanking?: boolean;
  notifyStreak?: boolean;
  weeklyEmail?: boolean;
  notifySponsored?: boolean;
  sharePrices?: boolean;
  showInRegion?: boolean;
  showName?: boolean;
  personalizeOffers?: boolean;
  sharePartners?: boolean;
  regionRadiusKm?: number;
}

/** Interruptores que são consentimento, e viram linha em `Consent`. */
const SAO_CONSENTIMENTO: Array<keyof MudancaDePreferencias> = [
  'sharePartners',
  'personalizeOffers',
  'sharePrices',
];

@Injectable()
export class PreferenciasService {
  constructor(private readonly prisma: PrismaService) {}

  async ler(userId: string) {
    const existentes = await this.prisma.preferences.findUnique({ where: { userId } });
    if (existentes) return existentes;

    // Conta antiga sem linha: cria com os padrões em vez de devolver nulo e
    // obrigar cada tela a tratar o caso.
    return this.prisma.preferences.create({ data: { userId } });
  }

  async alterar(userId: string, mudanca: MudancaDePreferencias) {
    await this.ler(userId);

    const atualizadas = await this.prisma.preferences.update({
      where: { userId },
      data: mudanca,
    });

    // Ligar ou desligar compartilhamento é consentimento: fica registrado com
    // data, porque o ônus de provar é do controlador (LGPD, art. 8º, §2º).
    for (const campo of SAO_CONSENTIMENTO) {
      const valor = mudanca[campo];
      if (typeof valor === 'boolean') {
        await this.prisma.consent.create({
          data: { userId, kind: campo, granted: valor },
        });
      }
    }

    return atualizadas;
  }

  /**
   * Está dentro do horário de silêncio?
   *
   * Atravessa a meia-noite: 22:00–08:00 é o padrão, e comparar "maior que 22 e
   * menor que 8" daria sempre falso.
   */
  async emSilencio(userId: string, agora = new Date()): Promise<boolean> {
    const preferencias = await this.ler(userId);

    const emMinutos = (relogio: string): number => {
      const [hora, minuto] = relogio.split(':').map(Number);
      return (hora ?? 0) * 60 + (minuto ?? 0);
    };

    // Horário de Brasília: o silêncio é o da pessoa, não o do servidor.
    const brasilia = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
    const minutoAtual = brasilia.getUTCHours() * 60 + brasilia.getUTCMinutes();

    const inicio = emMinutos(preferencias.quietStart);
    const fim = emMinutos(preferencias.quietEnd);

    if (inicio === fim) return false;
    if (inicio < fim) return minutoAtual >= inicio && minutoAtual < fim;

    // Atravessa a meia-noite.
    return minutoAtual >= inicio || minutoAtual < fim;
  }
}
