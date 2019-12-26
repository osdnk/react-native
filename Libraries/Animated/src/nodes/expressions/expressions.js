/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

export type ExpressionType =
  | 'add'
  | 'sub'
  | 'multiply'
  | 'divide'
  | 'pow'
  | 'modulo'
  | 'abs'
  | 'sqrt'
  | 'log'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'acos'
  | 'asin'
  | 'atan'
  | 'exp'
  | 'round'
  | 'and'
  | 'or'
  | 'not'
  | 'eq'
  | 'neq'
  | 'lessThan'
  | 'greaterThan'
  | 'lessOrEq'
  | 'greaterOrEq'
  | 'cond'
  | 'set'
  | 'block'
  | 'value'
  | 'number';
