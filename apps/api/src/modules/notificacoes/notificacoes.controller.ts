import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsuarioAtual, type UsuarioAutenticado } from '../../comum/usuario-atual.js';
import { JwtGuarda } from '../auth/guardas/jwt.guarda.js';
import { NotificacoesService } from './notificacoes.service.js';
import { CancelarPushDto, InscreverPushDto } from './dto/notificacoes.dto.js';

@ApiTags('notificacoes')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtGuarda)
export class NotificacoesController {
  constructor(private readonly notificacoes: NotificacoesService) {}

  @Get('notifications')
  @ApiQuery({ name: 'type', enum: ['all', 'prices', 'game'], required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOperation({ summary: 'Central de notificações' })
  async listar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('type') tipo?: 'all' | 'prices' | 'game',
    @Query('cursor') cursor?: string,
  ) {
    return this.notificacoes.listar(usuario.id, tipo, cursor);
  }

  @Post('notifications/read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marca todas como lidas' })
  async lerTodas(@UsuarioAtual() usuario: UsuarioAutenticado): Promise<void> {
    await this.notificacoes.marcarTodasComoLidas(usuario.id);
  }

  @Post('notifications/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marca uma como lida' })
  async ler(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
  ): Promise<void> {
    await this.notificacoes.marcarComoLida(usuario.id, id);
  }

  @Get('push/can-ask')
  @ApiOperation({
    summary: 'Já dá para pedir permissão de notificação?',
    description:
      'Só depois da primeira nota lida: pedir na abertura queima a única chance que o navegador dá.',
  })
  async podePedir(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return { canAsk: await this.notificacoes.podePedirPermissao(usuario.id) };
  }

  @Post('push/subscribe')
  @ApiOperation({ summary: 'Inscreve o aparelho para Web Push' })
  async inscrever(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dados: InscreverPushDto,
  ) {
    await this.notificacoes.inscreverParaPush(usuario.id, dados);
    return { ok: true };
  }

  @Delete('push/subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancela a inscrição deste aparelho' })
  async cancelar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dados: CancelarPushDto,
  ): Promise<void> {
    await this.notificacoes.cancelarPush(usuario.id, dados.endpoint);
  }
}
