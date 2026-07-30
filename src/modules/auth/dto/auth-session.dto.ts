import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum AuthSessionClientType {
  WEB = 'WEB',
  IOS = 'IOS',
  ANDROID = 'ANDROID',
}

registerEnumType(AuthSessionClientType, { name: 'AuthSessionClientType' });

@ObjectType()
export class AuthSessionDto {
  @Field(() => ID)
  id: string;

  @Field(() => AuthSessionClientType)
  clientType: AuthSessionClientType;

  @Field(() => String, { nullable: true })
  deviceName?: string | null;

  @Field(() => String, { nullable: true })
  userAgent?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  lastUsedAt: Date;

  @Field(() => Date)
  expiresAt: Date;
}
