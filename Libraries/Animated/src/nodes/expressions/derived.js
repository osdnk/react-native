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

import type {ExpressionNode, ExpressionParam} from './types';
import {factories} from './factories';
const {block, cond, sub, eq, add, neq, set, call} = factories;

export function onChange(
  value: AnimatedWithChildren,
  expression: ExpressionNode,
): ExpressionNode {
  const prevValue = new AnimatedValue(Number.MIN_SAFE_INTEGER);
  value.__addChild(prevValue);
  return block(
    cond(eq(prevValue, Number.MIN_SAFE_INTEGER), set(prevValue, value)),
    cond(neq(prevValue, value), [set(prevValue, value), expression]),
  );
}

export function debug(message: string, node: ExpressionParam): ExpressionNode {
  return block(
    call([node], (args: number[]) => {
      console.info(message, args[0]);
    }),
    node,
  );
}

export function diff(value: AnimatedValue): ExpressionNode {
  const stash = new AnimatedValue(0);
  const prevValue = new AnimatedValue(Number.MIN_SAFE_INTEGER);
  value.__addChild(prevValue);
  return block([
    set(
      stash,
      cond(eq(prevValue, Number.MIN_SAFE_INTEGER), sub(value, prevValue), 0),
    ),
    set(prevValue, value),
    stash,
  ]);
}

export function acc(value: AnimatedValue): ExpressionNode {
  const accumulator = new AnimatedValue(0);
  value.__addChild(accumulator);
  return set(accumulator, add(accumulator, value));
}
