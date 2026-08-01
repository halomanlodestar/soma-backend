import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateCollectionInput {
  @Field(() => String)
  @IsString()
  @MaxLength(120)
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  isPublic: boolean;
}

@InputType()
export class UpdateCollectionInput {
  @Field(() => String)
  @IsUUID()
  collectionId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

@InputType()
export class CollectionPostInput {
  @Field(() => String)
  @IsUUID()
  collectionId: string;

  @Field(() => String)
  @IsUUID()
  postId: string;
}

@InputType()
export class ReorderCollectionItemsInput {
  @Field(() => String)
  @IsUUID()
  collectionId: string;

  @Field(() => [String])
  @IsArray()
  @IsUUID('4', { each: true })
  postIds: string[];
}
