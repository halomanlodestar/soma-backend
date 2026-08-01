import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { SomaCreatorApplicationStatus } from '../types/soma-access.enums';

@InputType()
export class ReviewSomaCreatorApplicationInput {
  @Field(() => String)
  @IsUUID()
  applicationId: string;

  @Field(() => SomaCreatorApplicationStatus)
  @IsEnum(SomaCreatorApplicationStatus)
  decision: SomaCreatorApplicationStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  reviewerNote?: string;
}
