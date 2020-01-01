/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const AnimatedNode = require('../AnimatedNode');
const AnimatedValue = require('../AnimatedValue');

export type ExpressionParam =
  | AnimatedValue
  | AnimatedNode
  | ExpressionNode
  | number;

export type ExpressionNode = {
  type: string,
  a?: ExpressionNode,
  b?: ExpressionNode,
  others?: ExpressionNode[],
  left?: ExpressionNode,
  right?: ExpressionNode,
  v?: ExpressionNode,
  value?: number,
  target?: ExpressionNode,
  source?: ExpressionNode,
  nodes?: ExpressionNode[],
  expr?: ExpressionNode,
  ifNode?: ExpressionNode,
  elseNode?: ExpressionNode,
  getTag?: () => number,
  getValue?: () => number,
  setValue?: (value: number) => void,
  node?: AnimatedNode | AnimatedValue,
  args?: ExpressionNode[],
  callback?: (args: number[]) => void,
};

export type NativeExpressionNode = {
  type: string,
  a?: ExpressionNode,
  b?: ExpressionNode,
  others?: ExpressionNode[],
  left?: ExpressionNode,
  right?: ExpressionNode,
  v?: ExpressionNode,
  value?: number,
  target?: number,
  source?: ExpressionNode,
  nodes?: ExpressionNode[],
  expr?: ExpressionNode,
  ifNode?: ExpressionNode,
  elseNode?: ExpressionNode,
  tag?: number,
  args?: ExpressionNode[],
  callback?: (args: number[]) => void,
};
