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

type BaseExpressionNode = {
  type: string,
  nodeId: number,
};

export type MultiExpressionNode = {
  ...BaseExpressionNode,
  a: ExpressionNode,
  b: ExpressionNode,
  others: ExpressionNode[],
};

export type UnaryExpressionNode = {
  ...BaseExpressionNode,
  v: ExpressionNode,
};

export type BooleanExpressionNode = {
  ...BaseExpressionNode,
  left: ExpressionNode,
  right: ExpressionNode,
};

export type NumberExpressionNode = {
  ...BaseExpressionNode,
  value: number,
};

export type AnimatedValueExpressionNode = {
  ...BaseExpressionNode,
  node: AnimatedValue | AnimatedNode,
  getTag: () => number,
  getValue: () => number,
  setValue: (value: number) => void,
};

export type SetStatementNode = {
  ...BaseExpressionNode,
  target: AnimatedValueExpressionNode,
  source: ExpressionNode,
};

export type BlockStatementNode = {
  ...BaseExpressionNode,
  nodes: ExpressionNode[],
};

export type CondStatementNode = {
  ...BaseExpressionNode,
  expr: ExpressionNode,
  ifNode: ExpressionNode,
  elseNode: ExpressionNode,
};

export type CallStatementNode = {
  ...BaseExpressionNode,
  args: ExpressionNode[],
  callback: (args: number[]) => void,
};

export type ProcStatementNode = {
  ...BaseExpressionNode,
  args: ExpressionNode[],
  params: ExpressionNode[],
  evaluator: (...args: ExpressionParam[]) => ExpressionNode,
};

export type ExpressionNode =
  | MultiExpressionNode
  | BooleanExpressionNode
  | UnaryExpressionNode
  | NumberExpressionNode
  | AnimatedValueExpressionNode
  | SetStatementNode
  | BlockStatementNode
  | CondStatementNode
  | CallStatementNode
  | ProcStatementNode;

export type NativeMultiExpressionNode = {
  ...BaseExpressionNode,
  a: NativeExpressionNode,
  b: NativeExpressionNode,
  others: NativeExpressionNode[],
};

export type NativeUnaryExpressionNode = {
  ...BaseExpressionNode,
  v: NativeExpressionNode,
};

export type NativeBooleanExpressionNode = {
  ...BaseExpressionNode,
  left: NativeExpressionNode,
  right: NativeExpressionNode,
};

export type NativeNumberExpressionNode = {
  ...BaseExpressionNode,
  value: number,
};

export type NativeAnimatedValueExpressionNode = {
  ...BaseExpressionNode,
  tag: number,
};

export type NativeSetStatementNode = {
  ...BaseExpressionNode,
  target: number,
  source: NativeExpressionNode,
};

export type NativeBlockStatementNode = {
  ...BaseExpressionNode,
  nodes: NativeExpressionNode[],
};

export type NativeCondStatementNode = {
  ...BaseExpressionNode,
  expr: NativeExpressionNode,
  ifNode: NativeExpressionNode,
  elseNode: NativeExpressionNode,
};

export type NativeCallStatementNode = {
  ...BaseExpressionNode,
  args: NativeExpressionNode[],
  callback: (args: number[]) => void,
};

export type NativeProcStatementNode = {
  ...BaseExpressionNode,
  args: NativeExpressionNode[],
  params: NativeExpressionNode[],
  expr: NativeExpressionNode,
};

export type NativeExpressionNode =
  | NativeMultiExpressionNode
  | NativeBooleanExpressionNode
  | NativeUnaryExpressionNode
  | NativeNumberExpressionNode
  | NativeAnimatedValueExpressionNode
  | NativeSetStatementNode
  | NativeBlockStatementNode
  | NativeCondStatementNode
  | NativeCallStatementNode
  | NativeProcStatementNode;
