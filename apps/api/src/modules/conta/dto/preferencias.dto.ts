import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

const RELOGIO = /^([01]\d|2[0-3]):[0-5]\d$/;

export class AlterarPreferenciasDto {
  @ApiPropertyOptional({ enum: ['SYSTEM', 'LIGHT', 'DARK', 'CONTRAST'] })
  @IsOptional()
  @IsIn(['SYSTEM', 'LIGHT', 'DARK', 'CONTRAST'])
  theme?: 'SYSTEM' | 'LIGHT' | 'DARK' | 'CONTRAST';

  @ApiPropertyOptional({ enum: ['NORMAL', 'GRANDE', 'MUITO_GRANDE'] })
  @IsOptional()
  @IsIn(['NORMAL', 'GRANDE', 'MUITO_GRANDE'])
  textSize?: 'NORMAL' | 'GRANDE' | 'MUITO_GRANDE';

  @ApiPropertyOptional() @IsOptional() @IsBoolean() highContrast?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() easyMode?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() readAloud?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() reduceMotion?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() vibrate?: boolean;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @Matches(RELOGIO, { message: 'Use o formato 22:00.' })
  quietStart?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @Matches(RELOGIO, { message: 'Use o formato 08:00.' })
  quietEnd?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyPriceDrop?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyListOffer?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyReminder?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyRanking?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyStreak?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() weeklyEmail?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notifySponsored?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sharePrices?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showInRegion?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showName?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() personalizeOffers?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sharePartners?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  regionRadiusKm?: number;
}
