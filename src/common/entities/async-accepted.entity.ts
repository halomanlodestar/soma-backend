import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AsyncAccepted {
  constructor(commandId: string) {
    this.commandId = commandId;
  }

  @Field(() => ID)
  commandId: string;
}
