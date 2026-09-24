import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrivacidadeService } from './privacidade.service.js';
import { ExpurgoJob } from './expurgo.job.js';

@Module({
  imports: [AuthModule],
  providers: [PrivacidadeService, ExpurgoJob],
  exports: [PrivacidadeService],
})
export class PrivacidadeModule {}
