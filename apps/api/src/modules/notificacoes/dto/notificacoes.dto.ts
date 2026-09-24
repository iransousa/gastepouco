import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsUrl } from 'class-validator';

export class InscreverPushDto {
  @ApiProperty({ description: 'Endpoint dado pelo navegador' })
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'Endpoint inválido.' })
  endpoint!: string;

  @ApiProperty({ example: { p256dh: '...', auth: '...' } })
  @IsObject()
  keys!: { p256dh: string; auth: string };
}

export class CancelarPushDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  endpoint!: string;
}
