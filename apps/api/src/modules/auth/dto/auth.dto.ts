import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Regra da senha (docs/04-API.md): 8 caracteres, um número e uma letra
 * maiúscula. A mensagem diz o que falta, não "senha inválida" — quem não sabe
 * a regra fica preso na tela.
 */
const REGRA_DA_SENHA = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const MENSAGEM_DA_SENHA = 'A senha precisa de 8 caracteres, um número e uma letra maiúscula.';

export class RegistrarDto {
  @ApiProperty({ example: 'Camila Alves' })
  @IsString()
  @IsNotEmpty({ message: 'Digite seu nome.' })
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'camila.alves@email.com' })
  @IsEmail({}, { message: 'Digite um e-mail válido.' })
  email!: string;

  @ApiProperty({ example: 'Economia2026' })
  @Matches(REGRA_DA_SENHA, { message: MENSAGEM_DA_SENHA })
  password!: string;

  @ApiPropertyOptional({ example: '70750-505' })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string;

  @ApiProperty({ description: 'Aceite dos termos e da política de privacidade.' })
  @IsBoolean()
  acceptTerms!: boolean;
}

export class ConfirmarEmailDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Digite um e-mail válido.' })
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'O código tem 6 números.' })
  code!: string;
}

export class ReenviarCodigoDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Digite um e-mail válido.' })
  email!: string;
}

export class EntrarDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Digite um e-mail válido.' })
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Digite sua senha.' })
  password!: string;
}

export class EsqueciSenhaDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Digite um e-mail válido.' })
  email!: string;
}

export class NovaSenhaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty()
  @Matches(REGRA_DA_SENHA, { message: MENSAGEM_DA_SENHA })
  password!: string;
}

export class TrocarSenhaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Digite a senha atual.' })
  current!: string;

  @ApiProperty()
  @Matches(REGRA_DA_SENHA, { message: MENSAGEM_DA_SENHA })
  next!: string;
}

/** Mínimo para desenvolvimento: a senha nunca sai em resposta. */
export class MinLengthSenha {
  @MinLength(8)
  senha!: string;
}
