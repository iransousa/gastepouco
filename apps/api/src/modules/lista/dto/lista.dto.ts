import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AcrescentarItemDto {
  @ApiPropertyOptional({ description: 'Quando o item vem do catálogo' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ example: 'Café torrado e moído 500g' })
  @IsString()
  @IsNotEmpty({ message: 'Escreva o que você quer comprar.' })
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'A quantidade precisa ser pelo menos 1.' })
  quantity?: number;
}

export class AlterarItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  checked?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'A quantidade precisa ser pelo menos 1.' })
  quantity?: number;
}
