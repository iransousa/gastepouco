import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { erro } from '@gastemenos/shared';
import { UsuarioAtual, type UsuarioAutenticado } from '../../comum/usuario-atual.js';
import { JwtGuarda } from '../auth/guardas/jwt.guarda.js';
import { PrecosService } from './precos.service.js';
import { AlertasDePrecoService } from './alertas.service.js';
import { CriarAlertaDto } from './dto/precos.dto.js';

type Janela = '30d' | '6m' | '1y';

@ApiTags('precos')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtGuarda)
export class PrecosController {
  constructor(
    private readonly precos: PrecosService,
    private readonly alertas: AlertasDePrecoService,
  ) {}

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  @ApiOperation({ summary: 'Busca produto por nome' })
  async buscar(@Query('q') termo: string) {
    return this.precos.buscarProdutos(termo ?? '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Produto e categoria' })
  async produto(@Param('id') id: string) {
    const achado = await this.precos.produto(id);
    if (!achado) throw new HttpException(erro('NOT_FOUND'), HttpStatus.NOT_FOUND);
    return achado;
  }

  @Get(':id/prices')
  @ApiQuery({ name: 'range', enum: ['30d', '6m', '1y'], required: false })
  @ApiOperation({
    summary: 'Histórico de preço do produto na região',
    description:
      'Só devolve períodos que cumprem o anonimato mínimo: 5 notas de 3 pessoas. Região sem dados volta com enoughData=false.',
  })
  async historico(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') productId: string,
    @Query('range') janela?: string,
  ) {
    const valida: Janela = janela === '30d' || janela === '1y' ? janela : '6m';
    return this.precos.historico(usuario.id, productId, valida);
  }

  @Get(':id/stores')
  @ApiOperation({ summary: 'Lojas mais baratas na região, nos últimos 7 dias' })
  async lojas(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') productId: string) {
    return this.precos.lojasMaisBaratas(usuario.id, productId);
  }

  @Post(':id/alert')
  @ApiOperation({ summary: 'Avisar quando este produto ficar mais barato' })
  async criarAlerta(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') productId: string,
    @Body() dados: CriarAlertaDto,
  ) {
    return this.alertas.criar(usuario.id, productId, dados.targetCents);
  }

  @Delete(':id/alert')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Parar de avisar sobre este produto' })
  async removerAlerta(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') productId: string,
  ): Promise<void> {
    await this.alertas.remover(usuario.id, productId);
  }
}
