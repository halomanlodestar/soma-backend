import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SomaCreatorApplicationStatus } from '../types/soma-access.enums';

@ObjectType()
export class SomaCreatorApplication {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  applicantId: string;

  @Field(() => String)
  somaId: string;

  @Field(() => [String])
  portfolioUrls: string[];

  @Field(() => [String])
  disciplines: string[];

  @Field(() => String)
  statement: string;

  @Field(() => [String])
  processSamples: string[];

  @Field(() => Boolean)
  moderationConsent: boolean;

  @Field(() => SomaCreatorApplicationStatus)
  status: SomaCreatorApplicationStatus;

  @Field(() => String, { nullable: true })
  reviewerId: string | null;

  @Field(() => String, { nullable: true })
  reviewerNote: string | null;

  @Field(() => Date, { nullable: true })
  reviewedAt: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
