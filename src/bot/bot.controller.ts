import { Controller, Get, Res } from '@nestjs/common';
import { BotService } from './bot.service';
import { PrismaService } from '../prisma.service'

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService,
    private prisma: PrismaService
  ) {}

  @Get()
  getDialog(@Res() res) {
    this.botService.startBot()
  }
  @Get('/data')
  getData() {
    return this.prisma.user.findMany()
  }
}
