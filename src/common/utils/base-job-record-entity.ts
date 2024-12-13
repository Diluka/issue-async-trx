import { BaseEntity } from '@app/shared';
import { Job } from 'bullmq';
import { Column } from 'typeorm';

export class BaseJobRecordEntity extends BaseEntity {
  @Column({ type: 'json', nullable: true })
  handledByJobs: {
    queueName: string;
    jobName: string;
    jobId: string | number;
  }[];

  static async appendHandledJob(job: Job, recordId?: string) {
    recordId = recordId || job.data.recordId;
    if (!recordId) return;
    return this.update(recordId, {
      handledByJobs: () =>
        `JSON_ARRAY_APPEND(IFNULL(handledByJobs,'[]'),'$',CAST('${JSON.stringify(
          {
            queueName: job.queueName,
            jobName: job.name,
            jobId: job.id,
          },
        )}' AS JSON))`,
    });
  }
}
