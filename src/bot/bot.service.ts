import { Injectable, OnModuleInit } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import axios from 'axios'
import { WeatherService } from '../weather/weather.service';
import { PhaseService } from '../phase/phase.service';
import { DbService } from '../db/db.service';
import { CronService } from '../cron/cron.service';
@Injectable()
export class BotService implements OnModuleInit {
  private bot: TelegramBot;
  constructor(private weatherService: WeatherService, private phaseService: PhaseService,
    private dbService: DbService,
    private cronService: CronService
  ) {
    this.bot = new TelegramBot(process.env.TOKEN, {polling: true})
  }
  onModuleInit() {
    this.startBot()
  }

  startBot() {
    this.bot.setMyCommands(
      [
        {command: '/create_notif', description: 'Добавить уведомление о прогнозе погоды'},
        {command: '/delete_notif', description: 'Удалить уведомление'},
        {command: '/get_notifs', description: 'Получить данные о всех уведомлениях'}
      ]
    )
    this.bot.on('message', async (msg) => {

      const chatId = msg.chat.id
      const message = msg.text

      if (message === '/start') {
        const user = await this.dbService.createUser(chatId)

        this.setBotGreetings(chatId)
        this.phaseService.setBotPhase('/start')
      } else if (message === '/create_notif') {
        this.phaseService.setBotPhase('/create_notif_city')

        this.createNotif(chatId)

        this.phaseService.setBotPhase('/create_notif_city')
      } else if (message == '/get_notifs') {
        this.phaseService.setBotPhase('/get_notifs')

        this.getNotifs(chatId)

        this.phaseService.setBotPhase('/start')
      } else if (message == '/delete_notif') {

        this.getDeletedNotifs(chatId)
      } else if ([' м.', ' ч.', ' д.'].indexOf(message.slice(-3)) != -1) {
        await this.createJob(message, chatId, this.phaseService.getCity())

        this.phaseService.setBotPhase('/start')
      }  else  {
        if (this.phaseService.getBotPhase() == '/create_notif_city') {
          this.phaseService.setBotPhase('/create_notif_city')

          const clouse = await this.getCity(message, chatId)
          console.log(clouse)
          if (!clouse) {
            this.phaseService.setBotPhase('/create_notif_city')
          } else {
            this.getInterval(chatId)
            this.phaseService.setBotPhase('/start')
          }
        }
      }
    })
    this.bot.on('callback_query', async (msg) => {
      this.handleDeleteNotif(msg.message.chat.id, msg.data.slice(4))
    })

  }
  private async setBotGreetings(chatId: number) {

    await this.bot.sendMessage(chatId, 'Здравствуйте! Вас приветствует UPS - бот для получения уведомлений о прогнозе погоды в разных городах.')
    setTimeout(async() => {
      await this.bot.sendMessage(chatId, 'Все просто: вводите город (не обязательно свой) и временной интервал (например, получать уведомление каждые 2 минуты, каждый час или каждый день).')
    }, 3000)
    setTimeout(async() => {
      await this.bot.sendMessage(chatId, 'Вы можете добавлять НЕСКОЛЬКО уведомлений, ИЗМЕНЯТЬ или УДАЛЯТЬ любые из них. Например, вы можете получать погоду в Серове каждую минуту и в Екатеринбурге каждый час.')
    }, 5000)
    setTimeout(async() => {
      await this.bot.sendMessage(chatId,
      'Бот управляется следующими коммандами (они также доступны через кнопку "Меню"):\n/create_notif - добавить уведомление о прогнозе погоды\n/delete_notif - удалить уведомление\n/get_notifs - получить данные о всех уведомлениях')
    }, 7000)
  }
  private async createNotif(chatId: number) {
    await this.bot.sendMessage(chatId, 'Хорошо, новое уведомление.\nВведите город:')
  }
  private async getCity(data: string, chatId: number) {
    const coords = await this.weatherService.getCoordsByCity(data)
    if (typeof coords == 'string') {
      await this.bot.sendMessage(chatId, coords)
      return false
    } else {
      this.phaseService.setCity(data)
      return true
    }
  }
  private async getInterval(chatId: number) {
    const intervals = await this.dbService.getIntervals(chatId)
    const keyboard_data: {text: string}[] = []
    for (let el of intervals) {
      keyboard_data.push({text: el.name})
    }
    const data = await this.bot.sendMessage(chatId, 'Выберите временной интервал\nЕсли вы хотите выбрать свой интервал, напишите его сейчас в сообщении в виде {число} {м или ч или д}.\nгде м - минуты, ч - часы, д - дни\nНапример: каждые 30 минут - 30 м.', {
      reply_markup: {
        keyboard: [keyboard_data]
      }
    })
    this.phaseService.setMessageId(data.message_id)
  }
  private async createJob(q: string, chatId: number, city: string){
    const amount_num = parseInt(q)
    if (!amount_num) {
      await this.bot.sendMessage(chatId, 'Ошибка формата: число не определено')
      return
    }
    let interval = 1
    console.log(amount_num)
    if (q[q.length - 2] == 'м') {
      interval = 1000 * 60 * amount_num
    } else if (q[q.length - 2] == 'ч') {
      interval = 1000 * 60 * 60 * amount_num
    } else if (q[q.length - 2] == 'д') {
      interval = 1000 * 60 * 60 * 24 * amount_num
    } else {
      await this.bot.sendMessage(chatId, 'Ошибка формата: дата не определена')
      return
    }
    const job = await this.dbService.createJob(chatId, q, city, interval)
    this.cronService.addInterval(job.id, interval, async () => {

      const coords = await this.weatherService.getCoordsByCity(city)
      console.log('ihg ' + city)
      console.log(coords)
      if (typeof coords == 'string') {
        await this.bot.sendMessage(chatId, 'Извините, возникла проблема при получении погоды')
      } else {
        const data = await this.weatherService.getWeatherByCity(coords.lat, coords.lon)
        if (typeof data == 'string') {
          await this.bot.sendMessage(chatId, 'Извините, возникла проблема при получении погоды')
        } else {
          await this.bot.sendMessage(chatId, 'Общая сводка о погоде в городе ' + city +'\nОписание: ' + data.description + '\nТемпература: ' + data.temp + '°C\nОщущается как: ' + data.feels_like + '°C\nДавление: ' + data.pressure + ' мм.рт.ст\nСкорость ветра: ' + data.speed + ' м/c\nОблачность: ' + data.cloudiness + '%')
        }
      }
    })
    await this.bot.deleteMessage(chatId, this.phaseService.getMessageId())
    await this.bot.sendMessage(chatId, 'Уведомление успешно поставлено!')
  }
  private async getNotifs(chatId: number) {
    const jobs = await this.dbService.getJobsByUser(chatId)
    if (jobs.length == 0) {
      await this.bot.sendMessage(chatId, 'У вас нет не одного уведомления на прогноз погоды!')
    } else {
      let mess_text = ``
      for (let el of jobs) {
        let text_to_add = `Город: ${el.city}, время: ${el.name}\n`
        mess_text += text_to_add
      }
      await this.bot.sendMessage(chatId, 'Все ваши уведомления:\n' + mess_text)
    }
  }
  private async getDeletedNotifs(chatId: number) {
    const jobs = await this.dbService.getJobsByUser(chatId)
    if (jobs.length == 0) {
      await this.bot.sendMessage(chatId, 'У вас нет не одного уведомления на прогноз погоды!')
    } else {
      let mess_text: {text: string, callback_data: string}[][] = []
      for (let el of jobs) {
        let text_to_add = [{text: `Город: ${el.city}, время: ${el.name}`, callback_data: 'id: ' + el.id}]
        mess_text.push(text_to_add)
      }
      console.log(mess_text)
      await this.bot.sendMessage(chatId, 'Выберите уведомление для удаления:', {
        reply_markup: {
          inline_keyboard: mess_text
        }
      })
    }
  }
  private async handleDeleteNotif(chatId: number, id: string) {
    const job = await this.dbService.deleteJob(id)
    this.cronService.deleteInterval(job.id)
    await this.bot.sendMessage(chatId, 'Уведомление успешно удалено!')
  }
}
