import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { IsEnum } from 'class-validator';
import { SomaMembershipMode } from '../../soma-memberships/types/soma-access.enums';

@InputType()
export class UpdateSomaDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @Field(() => SomaMembershipMode, { nullable: true })
  @IsOptional()
  @IsEnum(SomaMembershipMode)
  membershipMode?: SomaMembershipMode;
}
