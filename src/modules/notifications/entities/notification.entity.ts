import { ObjectType, Field, ID } from '@nestjs/graphql';
import type {
  Notification as PrismaNotification,
  Prisma,
} from '../../../prisma/generated/client';
import { GraphQLJSON } from '../../../common/scalars/json.scalar';

@ObjectType()
export class Notification implements PrismaNotification {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  recipientId: string;

  @Field(() => String, { nullable: true })
  actorId: string | null;

  @Field(() => String)
  eventType: string;

  @Field(() => GraphQLJSON)
  eventData: Prisma.JsonValue;

  sourceEventId: string;

  @Field(() => Date, { nullable: true })
  readAt: Date | null;

  @Field(() => Date)
  createdAt: Date;
}
