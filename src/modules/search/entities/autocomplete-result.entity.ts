import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum AutocompleteResultKind {
  POST = 'POST',
  CREATOR = 'CREATOR',
  SOMA = 'SOMA',
}

registerEnumType(AutocompleteResultKind, {
  name: 'AutocompleteResultKind',
});

@ObjectType()
export class AutocompleteResult {
  @Field(() => AutocompleteResultKind)
  kind: AutocompleteResultKind;

  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  subtitle: string | null;

  @Field(() => String, { nullable: true })
  slug: string | null;

  @Field(() => String, { nullable: true })
  imageUrl: string | null;
}
