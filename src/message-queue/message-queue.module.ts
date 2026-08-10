import { Module } from '@nestjs/common';

/**
 * MessageQueue module — equivalent to MessageQueue.Configurations.MessageQueueDependencyInjectionConfig.
 * Currently a no-op stub, like the .NET origin.
 *
 * When implemented, this module will provide:
 * - BullMQ for background jobs (equivalent to Hangfire)
 * - SNS/SQS for event-driven messaging (equivalent to MassTransit)
 * - Transactional outbox pattern
 */
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class MessageQueueModule {}
