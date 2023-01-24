type NumberCounter<
  Number extends number,
  Counter extends any[],
  Accumulator extends number
> = Counter['length'] extends Number
  ? Accumulator
  : NumberCounter<Number, [any, ...Counter], Accumulator | Counter['length']>;

export type MaxNumber<Number extends number> = Number extends Number
  ? number extends Number
    ? number
    : Number extends 0
    ? never
    : NumberCounter<Number, [], 0>
  : never;

export type MinMaxNumber<Start extends number, End extends number> = Exclude<
  MaxNumber<End>,
  MaxNumber<Start>
>;
