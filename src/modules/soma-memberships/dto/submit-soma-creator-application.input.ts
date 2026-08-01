import { Field, InputType } from '@nestjs/graphql';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class SubmitSomaCreatorApplicationInput {
  @Field(() => String)
  @IsUUID()
  somaId: string;

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  portfolioUrls: string[];

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  disciplines: string[];

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  @MaxLength(5000)
  statement: string;

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  processSamples: string[];

  @Field(() => Boolean)
  @IsBoolean()
  moderationConsent: boolean;
}
