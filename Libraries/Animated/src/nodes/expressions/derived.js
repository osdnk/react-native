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
} from './types';
import {factories} from './factories';
const {block, cond, sub, eq, add, neq, set, format, call} = factories;

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
): BlockStatementNode | number {
  if (__DEV__) {
    return block(
      call([node], (args: number[]) => {
        console.info(message, args[0]);
      }),
      node,
    );
  } else {
    return 0;
  }
}

export function diff(value: AnimatedValue): BlockStatementNode {
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

export function acc(value: AnimatedValue): SetStatementNode {
  const accumulator = new AnimatedValue(0);
  value.__addChild(accumulator);
  return set(accumulator, add(accumulator, value));
}

export function concat(...args: ExpressionParam[]): FormatExpressionNode {
  const formatStr = args.map(_ => '%f').join('');
  return format(formatStr, ...args);
}
