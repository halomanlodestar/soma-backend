import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

@InputType()
export class SearchPostsInput {
  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  query: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  somaId?: string;

  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(50)
  first = 20;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  after?: string;
}

@InputType()
export class AutocompleteInput {
  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  query: string;

  @Field(() => Int, { defaultValue: 8 })
  @IsInt()
  @Min(1)
  @Max(10)
  first = 8;
}
