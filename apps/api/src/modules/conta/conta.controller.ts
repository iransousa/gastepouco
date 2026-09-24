import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioAtual, type UsuarioAutenticado } from '../../comum/usuario-atual.js';
import { JwtGuarda } from '../auth/guardas/jwt.guarda.js';
import { ContaService } from './conta.service.js';
import { PerfilDeConsumoDto } from './dto/conta.dto.js';

@ApiTags('conta')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtGuarda)
export class ContaController {
  constructor(private readonly conta: ContaService) {}

  @Get('me')
  @ApiOperation({ summary: 'Usuário, nível, pontos, sequência e status' })
  async eu(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.conta.resumo(usuario.id);
  }

  @Get('me/profile')
  @ApiOperation({ summary: 'Perfil de consumo (as 5 perguntas)' })
  async perfil(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.conta.lerPerfil(usuario.id);
  }

  @Put('me/profile')
  @ApiOperation({ summary: 'Salva o perfil; a primeira vez vale 100 pontos' })
  async salvarPerfil(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dados: PerfilDeConsumoDto,
  ) {
    return this.conta.salvarPerfil(usuario.id, dados);
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Tema, texto, acessibilidade, notificações, privacidade' })
  async preferencias(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.conta.lerPreferencias(usuario.id);
  }
}
