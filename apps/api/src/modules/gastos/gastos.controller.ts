import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsuarioAtual, type UsuarioAutenticado } from '../../comum/usuario-atual.js';
import { JwtGuarda } from '../auth/guardas/jwt.guarda.js';
import { GastosService, type Periodo } from './gastos.service.js';

const PERIODOS: Periodo[] = ['month', '3months', 'year'];

function periodoValido(bruto?: string): Periodo {
  return PERIODOS.includes(bruto as Periodo) ? (bruto as Periodo) : 'month';
}

@ApiTags('gastos')
@ApiBearerAuth()
@Controller('spending')
@UseGuards(JwtGuarda)
export class GastosController {
  constructor(private readonly gastos: GastosService) {}

  @Get('summary')
  @ApiQuery({ name: 'period', enum: PERIODOS, required: false })
  @ApiQuery({ name: 'ref', required: false, example: '2026-09' })
  @ApiOperation({ summary: 'Total, comparação com o período anterior e orçamento' })
  async resumo(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('period') periodo?: string,
    @Query('ref') referencia?: string,
  ) {
    return this.gastos.resumo(usuario.id, periodoValido(periodo), referencia);
  }

  @Get('categories')
  @ApiQuery({ name: 'period', enum: PERIODOS, required: false })
  @ApiOperation({ summary: 'Gasto por categoria, da maior para a menor' })
  async categorias(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('period') periodo?: string,
    @Query('ref') referencia?: string,
  ) {
    return this.gastos.porCategoria(usuario.id, periodoValido(periodo), referencia);
  }

  @Get('weeks')
  @ApiQuery({ name: 'month', required: false, example: '2026-09' })
  @ApiOperation({ summary: 'Gasto por semana do mês' })
  async semanas(@UsuarioAtual() usuario: UsuarioAutenticado, @Query('month') mes?: string) {
    return this.gastos.porSemana(usuario.id, mes);
  }

  @Get('insights')
  @ApiQuery({ name: 'month', required: false })
  @ApiOperation({ summary: 'Item que mais pesou e o que ficou acima da média' })
  async destaques(@UsuarioAtual() usuario: UsuarioAutenticado, @Query('month') mes?: string) {
    return this.gastos.destaques(usuario.id, mes);
  }
}
