import { Module } from '@nestjs/common';
import { DevController } from './dev.controller.js';

/** Registrado só fora de produção — ver app.module.ts. */
@Module({ controllers: [DevController] })
export class DevModule {}
