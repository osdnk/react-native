/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const AnimatedWithChildren = require('../AnimatedWithChildren');
const AnimatedValue = require('../AnimatedValue');

import type {
  ExpressionNode,
  FormatExpressionNode,
  SetStatementNode,
  BlockStatementNode,
  ExpressionParam,
  NumberExpressionNode,
} from './types';
import {factories, resolve} from './factories';
const {
  block,
  cond,
  eq,
  add,
  neq,
  set,
  format,
  call,
  lessThan,
  multiply,
  sub,

  divide,
  greaterThan,
  lessOrEq,
} = factories;

export function onChange(
  value: AnimatedWithChildren,
  expression: ExpressionNode,
): BlockStatementNode {
  const prevValue = new AnimatedValue(Number.MIN_SAFE_INTEGER);
  value.__addChild(prevValue);
  return block(
    cond(eq(prevValue, Number.MIN_SAFE_INTEGER), set(prevValue, value)),
    cond(neq(prevValue, value), [set(prevValue, value), expression]),
  );
}

export function debug(
  message: string,
  node: ExpressionParam,
): BlockStatementNode | NumberExpressionNode {
  if (__DEV__) {
    return block(
      call([node], (args: number[]) => {
        console.info(message, args[0]);
      }),
      node,
    );
  } else {
    return ((resolve(0): any): NumberExpressionNode);
  }
}

export function acc(value: AnimatedValue): SetStatementNode {
  const accumulator = new AnimatedValue(0);
  value.__addChild(accumulator);
  return set(accumulator, add(accumulator, value));
}

export function concat(...args: ExpressionParam[]): FormatExpressionNode {
  const formatStr = args.map(_ => '%f').join('');
  return format(formatStr, ...args);
}

export const Extrapolate = {
  EXTEND: 'extend',
  CLAMP: 'clamp',
  IDENTITY: 'identity',
};

export type InterpolatConfig = {
  inputRange: number[],
  outputRange: ExpressionParam[],
  extrapolate: $Keys<typeof Extrapolate>,
  extrapolateLeft: $Keys<typeof Extrapolate>,
  extrapolateRight: $Keys<typeof Extrapolate>,
};

function interpolateInternalSingle(value, inputRange, outputRange, offset) {
  const inS = inputRange[offset];
  const inE = inputRange[offset + 1];
  const outS = outputRange[offset];
  const outE = outputRange[offset + 1];
  const progress = divide(sub(value, inS), sub(inE, inS));
  // logic below was made in order to provide a compatibility witn an Animated API
  const resultForNonZeroRange = add(outS, multiply(progress, sub(outE, outS)));
  const result = cond(
    eq(inS, inE),
    cond(lessOrEq(value, inS), outS, outE),
    resultForNonZeroRange,
  );
  return result;
}

function interpolateInternal(value, inputRange, outputRange, offset = 0) {
  if (inputRange.length - offset === 2) {
    return interpolateInternalSingle(value, inputRange, outputRange, offset);
  }
  return cond(
    lessThan(value, inputRange[offset + 1]),
    interpolateInternalSingle(value, inputRange, outputRange, offset),
    interpolateInternal(value, inputRange, outputRange, offset + 1),
  );
}

export function interpolate(
  value: AnimatedValue,
  config: InterpolatConfig,
): ExpressionNode {
  const {
    inputRange,
    outputRange,
    extrapolate = Extrapolate.EXTEND,
    extrapolateLeft,
    extrapolateRight,
  } = config;

  const left = extrapolateLeft || extrapolate;
  const right = extrapolateRight || extrapolate;
  let output = interpolateInternal(value, inputRange, outputRange);

  if (left === Extrapolate.EXTEND) {
  } else if (left === Extrapolate.CLAMP) {
    output = cond(lessThan(value, inputRange[0]), outputRange[0], output);
  } else if (left === Extrapolate.IDENTITY) {
    output = cond(lessThan(value, inputRange[0]), value, output);
  }

  if (right === Extrapolate.EXTEND) {
  } else if (right === Extrapolate.CLAMP) {
    output = cond(
      greaterThan(value, inputRange[inputRange.length - 1]),
      outputRange[outputRange.length - 1],
      output,
    );
  } else if (right === Extrapolate.IDENTITY) {
    output = cond(
      greaterThan(value, inputRange[inputRange.length - 1]),
      value,
      output,
    );
  }

  return output;
}
