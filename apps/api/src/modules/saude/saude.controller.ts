import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service.js';

@ApiTags('saude')
@Controller('saude')
export class SaudeController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Usado pelo Coolify e pelo docker-compose para saber se o serviço subiu.
   * Consulta o banco de verdade: processo no ar com banco fora é "saudável"
   * para o orquestrador e quebrado para a pessoa.
   */
  @Get()
  @ApiOperation({ summary: 'Estado da API e do banco' })
  async verificar(): Promise<{ status: string; banco: string; versao: string }> {
    let banco = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      banco = 'indisponivel';
    }

    return { status: banco === 'ok' ? 'ok' : 'degradado', banco, versao: '0.1.0' };
  }
}
