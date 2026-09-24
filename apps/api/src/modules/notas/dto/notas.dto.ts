import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

/**
 * A pessoa manda o QR code lido **ou** a chave digitada — nunca os dois, nunca
 * nenhum. A validação cruzada fica aqui para a tela receber a mensagem certa
 * em vez de um 500.
 */
export class RegistrarNotaDto {
  @ApiPropertyOptional({ description: 'Conteúdo do QR code lido pela câmera' })
  @ValidateIf((dto: RegistrarNotaDto) => !dto.accessKey)
  @IsString({ message: 'Envie o QR code ou a chave de 44 números.' })
  qrUrl?: string;

  @ApiPropertyOptional({ description: 'Os 44 números impressos na nota' })
  @ValidateIf((dto: RegistrarNotaDto) => !dto.qrUrl)
  @IsString()
  // Só o @Matches: o @Length viria com a mensagem padrão em inglês do
  // class-validator, e ela chegava na tela. Toda mensagem é em português
  // simples (CLAUDE.md, "Texto da interface").
  @Matches(/^\d{44}$/, { message: 'A chave precisa ter 44 números. Confira e tente de novo.' })
  accessKey?: string;

  @ApiPropertyOptional({ enum: ['qr', 'key', 'gallery'] })
  @IsOptional()
  @IsIn(['qr', 'key', 'gallery'])
  source?: string;
}
