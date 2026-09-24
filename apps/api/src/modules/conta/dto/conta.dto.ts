import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn } from 'class-validator';

/**
 * As 5 perguntas do primeiro uso (tela PerfilConsumo).
 *
 * Os valores são códigos curtos, não as frases: a frase muda quando o texto da
 * tela melhora, e não queremos migrar o banco por causa de uma vírgula.
 */
export class PerfilDeConsumoDto {
  @ApiProperty({ enum: ['1', '2', '3', '5'], description: 'Pessoas na casa' })
  @IsIn(['1', '2', '3', '5'])
  householdSize!: string;

  @ApiProperty({ example: ['super', 'atac'] })
  @IsArray()
  @ArrayNotEmpty({ message: 'Escolha pelo menos um lugar onde você compra.' })
  @IsIn(['super', 'atac', 'bairro', 'feira', 'app'], { each: true })
  storeTypes!: string[];

  @ApiProperty({ enum: ['sem', 'quin', 'mes', 'falta'] })
  @IsIn(['sem', 'quin', 'mes', 'falta'])
  frequency!: string;

  @ApiProperty({ enum: ['a', 'b', 'c', 'd'], description: 'Faixa de gasto mensal' })
  @IsIn(['a', 'b', 'c', 'd'])
  monthlySpendBand!: string;

  @ApiProperty({ example: ['preco', 'promo'], description: 'Até 3' })
  @IsArray()
  @ArrayNotEmpty({ message: 'Escolha pelo menos uma prioridade.' })
  @ArrayMaxSize(3, { message: 'Escolha no máximo 3.' })
  @IsIn(['preco', 'promo', 'marca', 'saude', 'perto'], { each: true })
  priorities!: string[];
}
