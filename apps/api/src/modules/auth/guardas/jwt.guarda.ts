import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** `@UseGuards(JwtGuarda)` protege a rota. */
@Injectable()
export class JwtGuarda extends AuthGuard('jwt') {}
