/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const AnimatedValue = require('../../AnimatedValue');

import type {ExpressionNode, ExpressionParam} from '../types';
import {factories} from '../factories';
const {
  cond,
  eq,
  add,
  lessThan,
  multiply,
  sub,
  divide,
  greaterThan,
  lessOrEq,
} = factories;

type Extrapolate = 'extend' | 'clamp' | 'identity';

export type InterpolatConfig = {
  inputRange: number[],
  outputRange: ExpressionParam[],
  extrapolate?: Extrapolate,
  extrapolateLeft?: Extrapolate,
  extrapolateRight?: Extrapolate,
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
    extrapolate = 'extend',
    extrapolateLeft,
    extrapolateRight,
  } = config;

  const left = extrapolateLeft || extrapolate;
  const right = extrapolateRight || extrapolate;
  let output = interpolateInternal(value, inputRange, outputRange);

  if (left === 'extend') {
  } else if (left === 'clamp') {
    output = cond(lessThan(value, inputRange[0]), outputRange[0], output);
  } else if (left === 'identiy') {
    output = cond(lessThan(value, inputRange[0]), value, output);
  }

  if (right === 'extend') {
  } else if (right === 'clamp') {
    output = cond(
      greaterThan(value, inputRange[inputRange.length - 1]),
      outputRange[outputRange.length - 1],
      output,
    );
  } else if (right === 'identiy') {
    output = cond(
      greaterThan(value, inputRange[inputRange.length - 1]),
      value,
      output,
    );
  }

  return output;
}
