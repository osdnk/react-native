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

import type {SetStatementNode} from '../types';
import {factories} from '../factories';
const {add, set} = factories;

export function acc(value: AnimatedValue): SetStatementNode {
  const accumulator = new AnimatedValue(0);
  value.__addChild(accumulator);
  return set(accumulator, add(accumulator, value));
}
