import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Award as PrismaAward,
  AwardTargetType,
} from '../../../prisma/generated/client';

@ObjectType()
export class Award implements PrismaAward {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  awardedById: string;

  @Field(() => String)
  targetType: AwardTargetType;

  @Field(() => String)
  targetId: string;

  @Field(() => String)
  name: string;

  @Field(() => Date)
  createdAt: Date;
}
