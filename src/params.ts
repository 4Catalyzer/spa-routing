export type PathParams<Path extends string> =
  Path extends `:${infer Param}/${infer Rest}`
    ? Param | PathParams<Rest>
    : Path extends `:${infer Param}`
    ? Param
    : Path extends `${infer _Prefix}:${infer Rest}`
    ? PathParams<`:${Rest}`>
    : never;

export type ReplaceParams<
  Path extends string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Sub extends Record<string, string> = {},
> = Path extends `:${infer P}/${infer Rest}`
  ? `${Sub[P]}/${ReplaceParams<Rest, Sub>}`
  : Path extends `:${infer P}`
  ? NonNullable<Sub[P]>
  : Path extends `${infer Prefix}:${infer Rest}`
  ? `${Prefix}${ReplaceParams<`:${Rest}`, Sub>}`
  : Path;

export type Params<Path extends string> = {
  [K in PathParams<Path>]: string;
};
