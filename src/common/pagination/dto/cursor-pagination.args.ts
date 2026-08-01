import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

@ArgsType()
export class CursorPaginationArgs {
  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  first = 20;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  after?: string;
}
