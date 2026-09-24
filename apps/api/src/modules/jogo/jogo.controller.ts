import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { chaveDoMes } from '../../comum/tempo.js';
import { UsuarioAtual, type UsuarioAutenticado } from '../../comum/usuario-atual.js';
import { JwtGuarda } from '../auth/guardas/jwt.guarda.js';
import { PontosService } from './pontos.service.js';
import { SelosService } from './selos.service.js';
import { AmigosService } from './amigos.service.js';
import {
  RankingService,
  type CategoriaDoRanking,
  type EscopoDoRanking,
} from './ranking.service.js';

export class EntrarComConviteDto {
  @ApiProperty({ example: 'CAMILA26' })
  @IsString()
  @IsNotEmpty({ message: 'Digite o código do convite.' })
  @Length(4, 16, { message: 'O código tem entre 4 e 16 caracteres.' })
  inviteCode!: string;
}

const ESCOPOS: EscopoDoRanking[] = ['friends', 'region'];
const CATEGORIAS: CategoriaDoRanking[] = ['savings', 'purchases', 'points'];

@ApiTags('jogo')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtGuarda)
export class JogoController {
  constructor(
    private readonly pontos: PontosService,
    private readonly selos: SelosService,
    private readonly ranking: RankingService,
    private readonly amigos: AmigosService,
  ) {}

  @Get('game/status')
  @ApiOperation({ summary: 'Nível, nome do nível, pontos e progresso' })
  async situacao(@UsuarioAtual() usuario: UsuarioAutenticado) {
    const nivel = await this.pontos.situacao(usuario.id);

    return {
      level: nivel.nivel,
      levelName: nivel.nome,
      points: nivel.pontosNoNivel,
      levelTarget: nivel.metaDoNivel,
      pointsToNext: nivel.pontosAteOProximo,
      progress: nivel.progresso,
      pointsTotal: await this.pontos.total(usuario.id),
    };
  }

  @Get('game/badges')
  @ApiOperation({ summary: 'Os 9 selos, com progresso' })
  async selosDoUsuario(@UsuarioAtual() usuario: UsuarioAutenticado) {
    // Confere antes de listar: quem acabou de bater a meta vê o selo aceso na
    // mesma visita, sem esperar o próximo job.
    await this.selos.conferirEConceder(usuario.id);
    return this.selos.listar(usuario.id);
  }

  @Get('game/ranking')
  @ApiQuery({ name: 'scope', enum: ESCOPOS, required: false })
  @ApiQuery({ name: 'category', enum: CATEGORIAS, required: false })
  @ApiQuery({ name: 'month', required: false, example: '2026-09' })
  @ApiOperation({ summary: 'Ranking do mês: pódio, lista e a sua posição' })
  async rankingDoMes(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('scope') escopo?: string,
    @Query('category') categoria?: string,
    @Query('month') mes?: string,
  ) {
    return this.ranking.calcular(
      usuario.id,
      ESCOPOS.includes(escopo as EscopoDoRanking) ? (escopo as EscopoDoRanking) : 'friends',
      CATEGORIAS.includes(categoria as CategoriaDoRanking)
        ? (categoria as CategoriaDoRanking)
        : 'savings',
      mes && /^\d{4}-\d{2}$/.test(mes) ? mes : chaveDoMes(),
    );
  }

  @Get('game/share-card')
  @ApiOperation({ summary: 'Os dados do cartão de compartilhar' })
  async cartao(@UsuarioAtual() usuario: UsuarioAutenticado) {
    const [nivel, selos, posicao, codigo] = await Promise.all([
      this.pontos.situacao(usuario.id),
      this.selos.listar(usuario.id),
      this.ranking.calcular(usuario.id, 'friends', 'savings'),
      this.amigos.meuCodigo(usuario.id),
    ]);

    return {
      level: nivel.nivel,
      levelName: nivel.nome,
      savingsCents: posicao.me?.value ?? 0,
      rank: posicao.me?.rank ?? null,
      // Três selos, os mais recentes: o cartão é pequeno e nove escudos viram
      // um borrão.
      badges: selos
        .filter((selo) => selo.unlocked)
        .sort((a, b) => (b.unlockedAt?.getTime() ?? 0) - (a.unlockedAt?.getTime() ?? 0))
        .slice(0, 3)
        .map((selo) => ({ id: selo.id, name: selo.name })),
      inviteCode: codigo.inviteCode,
    };
  }

  @Get('friends')
  @ApiOperation({ summary: 'Amigos conectados' })
  async listarAmigos(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.amigos.listar(usuario.id);
  }

  @Post('friends/join')
  @ApiOperation({ summary: 'Entrar no grupo de alguém pelo código de convite' })
  async entrarComConvite(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dados: EntrarComConviteDto,
  ) {
    return this.amigos.entrarComCodigo(usuario.id, dados.inviteCode);
  }
}
