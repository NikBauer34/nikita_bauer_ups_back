import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { PrismaService } from 'src/prisma.service';
import { WeatherModule } from 'src/weather/weather.module';
import { PhaseService } from 'src/phase/phase.service';
import { PhaseModule } from 'src/phase/phase.module';
import { DbModule } from 'src/db/db.module';
import { CronModule } from 'src/cron/cron.module';

@Module({
  imports: [WeatherModule, PhaseModule, DbModule, CronModule],
  providers: [BotService, PrismaService],
  controllers: [BotController]
})
export class BotModule {}
