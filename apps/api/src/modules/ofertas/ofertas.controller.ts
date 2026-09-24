import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsuarioAtual, type UsuarioAutenticado } from '../../comum/usuario-atual.js';
import { JwtGuarda } from '../auth/guardas/jwt.guarda.js';
import { OfertasService } from './ofertas.service.js';

@ApiTags('ofertas')
@ApiBearerAuth()
@Controller('offers')
@UseGuards(JwtGuarda)
export class OfertasController {
  constructor(private readonly ofertas: OfertasService) {}

  @Get()
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'onlyMyList', required: false, type: Boolean })
  @ApiQuery({ name: 'q', required: false })
  @ApiOperation({
    summary: 'Ofertas patrocinadas e quedas de preço da comunidade',
    description:
      'No máximo uma patrocinada por página, e toda oferta traz `sponsored` — quem consome esta API não recebe conteúdo pago sem saber que é pago.',
  })
  async listar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('category') categoria?: string,
    @Query('onlyMyList') soDaMinhaLista?: string,
    @Query('q') busca?: string,
  ) {
    return this.ofertas.listar(usuario.id, {
      category: categoria,
      onlyMyList: soDaMinhaLista === 'true',
      q: busca,
    });
  }

  @Post(':id/click')
  @ApiOperation({ summary: 'Registra o clique na oferta' })
  async clique(@Param('id') id: string) {
    await this.ofertas.registrarClique(id);
    return { ok: true };
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '"O preço está certo?" — 10 pontos, até 5 por dia' })
  async confirmar(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.ofertas.confirmarPreco(usuario.id, id);
  }
}
