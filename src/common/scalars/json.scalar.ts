import { GraphQLScalarType, Kind, type ValueNode } from 'graphql';

export const GraphQLJSON = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize(value: unknown): unknown {
    return value;
  },

  parseValue(value: unknown): unknown {
    return value;
  },

  parseLiteral(ast: ValueNode): unknown {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return Number(ast.value);
      case Kind.NULL:
        return null;
      case Kind.LIST:
        return ast.values.map((value) => GraphQLJSON.parseLiteral(value));
      case Kind.OBJECT:
        return Object.fromEntries(
          ast.fields.map((field) => [
            field.name.value,
            GraphQLJSON.parseLiteral(field.value),
          ]),
        );
      default:
        return null;
    }
  },
});
