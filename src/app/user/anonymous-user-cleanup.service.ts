import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { DataSource, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Session } from '../auth/entities/session.entity';

@Injectable()
export class AnonymousUserCleanupService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger, // write log when run scheduled jobs
  ) {
    this.logger.setContext(AnonymousUserCleanupService.name);
  }

  // run every 3 a.m: delete anonymous users who run out of time in database
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredAnonymousUsers() {
    const RETETNION_DAYS = 7;
    const cutoff = new Date(Date.now() - RETETNION_DAYS * 24 * 60 * 60 * 1000);

    const deletedCount = await this.dataSource.transaction(async (manager) => {
      const staleUsers = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .where('user.isAnonymous = :anon', { anon: true })
        .andWhere('user.createdAt < :cutoff', { cutoff })
        .andWhere((qb) => {
          const sub = qb
            .subQuery()
            .select('1')
            .from(Session, 'session')
            .where('session.userId = user.id')
            .andWhere('session.expiresAt > :now', { now: new Date() })
            .getQuery();
          return `NOT EXISTS ${sub}`;
        })
        .getMany();

      if (!staleUsers.length) {
        return 0;
      }

      // get users' id, then delete session first, delele user after
      const ids = staleUsers.map((u) => u.id);
      await manager.delete(Session, { userId: In(ids) });
      await manager.delete(User, { id: In(ids) });

      return ids.length;
    });

    this.logger.info({ msg: 'user.anonymous.cleanup', deleted: deletedCount });
  }
}
