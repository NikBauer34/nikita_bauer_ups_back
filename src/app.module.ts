import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {ConfigModule} from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule';
import { BotModule } from './bot/bot.module';
import { CronModule } from './cron/cron.module';
import { DbModule } from './db/db.module';
import { WeatherModule } from './weather/weather.module';
import { PhaseModule } from './phase/phase.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env'
    }),
    BotModule,
    CronModule,
    DbModule,
    WeatherModule,
    PhaseModule
  ]
})
export class AppModule {}
