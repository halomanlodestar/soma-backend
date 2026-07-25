import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class BaseError {
  @Field(() => String)
  message: string;
}

@ObjectType()
export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found') {
    super();
    this.message = message;
  }
}

@ObjectType()
export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized access') {
    super();
    this.message = message;
  }
}

@ObjectType()
export class InvalidInputError extends BaseError {
  constructor(message: string = 'Invalid input provided') {
    super();
    this.message = message;
  }
}
