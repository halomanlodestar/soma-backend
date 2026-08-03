import { registerEnumType } from '@nestjs/graphql';

export enum SearchResultKind {
  POST = 'POST',
  CREATOR = 'CREATOR',
  SOMA = 'SOMA',
}

registerEnumType(SearchResultKind, { name: 'SearchResultKind' });
