import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { erro } from '@gastemenos/shared';
import { UsuarioAtual, type UsuarioAutenticado } from '../../comum/usuario-atual.js';
import { JwtGuarda } from '../auth/guardas/jwt.guarda.js';
import { ListaService } from './lista.service.js';
import { AcrescentarItemDto, AlterarItemDto } from './dto/lista.dto.js';

@ApiTags('lista')
@ApiBearerAuth()
@Controller('lists/current')
@UseGuards(JwtGuarda)
export class ListaController {
  constructor(private readonly lista: ListaService) {}

  @Get()
  @ApiOperation({ summary: 'Itens, estimativa e a loja mais barata para a lista toda' })
  async atual(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.lista.atual(usuario.id);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Sugestão de recompra, pelo intervalo entre compras' })
  async sugestoes(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.lista.sugestoes(usuario.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Acrescenta um item' })
  async acrescentar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dados: AcrescentarItemDto,
  ) {
    return this.lista.acrescentar(usuario.id, dados);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Marca como comprado ou muda a quantidade' })
  async alterar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() dados: AlterarItemDto,
  ) {
    const item = await this.lista.alterar(usuario.id, id, dados);
    if (!item) throw new HttpException(erro('NOT_FOUND'), HttpStatus.NOT_FOUND);
    return item;
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Tira o item da lista' })
  async remover(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
  ): Promise<void> {
    await this.lista.remover(usuario.id, id);
  }

  @Post('from-receipt/:receiptId')
  @ApiOperation({ summary: 'Repetir os itens de uma nota na lista' })
  async daNota(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('receiptId') receiptId: string,
  ) {
    const resultado = await this.lista.apartirDaNota(usuario.id, receiptId);
    if (!resultado) throw new HttpException(erro('NOT_FOUND'), HttpStatus.NOT_FOUND);
    return resultado;
  }
}
