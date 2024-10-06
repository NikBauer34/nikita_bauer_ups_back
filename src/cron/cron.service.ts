import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class CronService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}
  addInterval(name: string, milliseconds: number, callback: () => Promise<void>) {
    const interval = setInterval(callback, milliseconds)
    this.schedulerRegistry.addInterval(name, interval)
    const intervals = this.schedulerRegistry.getIntervals();
    console.log(intervals)
  }
  deleteInterval(name: string) {
    const intervals = this.schedulerRegistry.getIntervals();
    console.log(intervals)
    let isCronExists = false
    for(let el of intervals) {
      if (el == name) {
        isCronExists = true
      }
    }
    if (isCronExists) {
      this.schedulerRegistry.deleteInterval(name)
    }
  }
}
