import { Injectable } from '@nestjs/common';
type IBot_phase = '/start' | '/create_notif_city' | '/create_notif_time' | '/get_notifs'
@Injectable()
export class PhaseService {
  private bot_phase: IBot_phase
  private city: string
  private message_id: number
  constructor() {
    this.bot_phase = '/start'
    this.city = ""
    this.message_id = 0
  }
  getBotPhase() {
    return this.bot_phase
  }
  setBotPhase(data: IBot_phase) {
    this.bot_phase = data
  }
  getCity() {
    return this.city
  }
  setCity(data: string) {
    this.city = data
  }
  getMessageId() {
    return this.message_id
  }
  setMessageId(data: number) {
    this.message_id = data
  }
}
