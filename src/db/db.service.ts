import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DbService {
  constructor(private prisma: PrismaService,
    private schedulerRegistry: SchedulerRegistry
  ) {}
  async createUser(chatId: number) {
    const candidate = await this.prisma.user.findFirst({
      where: {chatId},
    })
    if (!candidate) {
      const user = await this.prisma.user.create({
        data: {
          chatId,
          intervals: {
            create:  [
              {name: '1 м.', interval: 1000 * 60},
              {name: '20 м.', interval: 1000 * 60 * 20},
              {name: '1 ч.', interval: 1000 * 60 * 60},
              {name: '1 д.', interval: 1000 * 60 * 60 * 24}
            ]
          }
        }
      })
      const newUser = await this.prisma.user.findMany({
        where: {
          id: user.id
        },
        include: {
          intervals: true,
          jobs: true
        }
      })
      console.log(newUser)
      return newUser
    } else {
      const candidate = await this.prisma.user.findFirst({
        where: {chatId},
        include: {
          intervals: true,
          jobs: true
        }
      })
      return candidate
    }
  }
  async getIntervals(chatId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        chatId
      }
    })
    const intervals = await this.prisma.interval.findMany({
      where: {
        userId: user.id
      }
    })
    console.log(intervals)
    return intervals
  }
  async createJob(chatId: number, name: string, city: string, interval: number) {
    const user = await this.prisma.user.findFirst({
      where: {chatId}
    })
    const job = await this.prisma.job.create({
      data: {
        city,
        name,
        interval,
        userId: user.id
      }
    })
    console.log(job)
    return job
  }
  async getJobsByUser(chatId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        chatId
      }
    })
    const jobs = await this.prisma.job.findMany({
      where: {
        userId: user.id
      }
    })
    console.log(jobs)
    return jobs
  }
  async deleteJob(id: string) {
    const job = await this.prisma.job.delete({
      where: {
        id
      }
    })
    console.log(job)
    return job
  }
}
