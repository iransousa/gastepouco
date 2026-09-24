import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CriarAlertaDto {
  @ApiPropertyOptional({
    description: 'Avisar quando cair abaixo deste valor, em centavos. Sem valor, avisa a cada queda relevante.',
    example: 1990,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetCents?: number;
}
