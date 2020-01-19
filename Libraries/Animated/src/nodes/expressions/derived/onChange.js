/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const AnimatedWithChildren = require('../../AnimatedWithChildren');
const AnimatedValue = require('../../AnimatedValue');

import type {ExpressionNode, BlockStatementNode} from '../types';
import {factories} from '../factories';
const {block, cond, eq, neq, set} = factories;

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
