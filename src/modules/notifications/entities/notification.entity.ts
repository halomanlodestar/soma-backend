import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Notification as PrismaNotification } from '../../../prisma/generated/client';

@ObjectType()
export class Notification implements PrismaNotification {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  type: string;

  @Field(() => String)
  message: string;

  @Field(() => String, { nullable: true })
  targetType: string | null;

  @Field(() => String, { nullable: true })
  targetId: string | null;

  @Field(() => Date, { nullable: true })
  readAt: Date | null;

  @Field(() => Date)
  createdAt: Date;
}
