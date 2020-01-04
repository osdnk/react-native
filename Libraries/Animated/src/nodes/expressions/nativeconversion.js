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

import type {
  ExpressionNode,
  MultiExpressionNode,
  UnaryExpressionNode,
  BooleanExpressionNode,
  NumberExpressionNode,
  AnimatedValueExpressionNode,
  SetStatementNode,
  BlockStatementNode,
  CondStatementNode,
  CallStatementNode,
  ProcStatementNode,
  NativeExpressionNode,
  NativeMultiExpressionNode,
  NativeUnaryExpressionNode,
  NativeBooleanExpressionNode,
  NativeNumberExpressionNode,
  NativeAnimatedValueExpressionNode,
  NativeSetStatementNode,
  NativeBlockStatementNode,
  NativeCondStatementNode,
  NativeCallStatementNode,
  NativeProcStatementNode,
} from './types';

const converters = {
  add: multi,
  sub: multi,
  multiply: multi,
  divide: multi,
  pow: multi,
  modulo: multi,
  max: multi,
  min: multi,
  abs: unary,
  sqrt: unary,
  log: unary,
  sin: unary,
  cos: unary,
  tan: unary,
  acos: unary,
  asin: unary,
  atan: unary,
  exp: unary,
  ceil: unary,
  floor: unary,
  round: unary,
  and: multi,
  or: multi,
  not: unary,
  eq: boolean,
  neq: boolean,
  lessThan: boolean,
  greaterThan: boolean,
  lessOrEq: boolean,
  greaterOrEq: boolean,
  value: animatedValue,
  number: convertNumber,
  cond: convertCondition,
  set: convertSet,
  block: convertBlock,
  call: convertCall,
  callProc: convertProc,
};

function convert(v: ?ExpressionNode): NativeExpressionNode {
  if (v === undefined || v === null) {
    throw Error('Value not defined.');
  }
  return converters[v.type](v);
}

function convertProc(node: ProcStatementNode): NativeProcStatementNode {
  return {
    type: node.type,
    nodeId: node.nodeId,
    args: (node.args ? node.args : []).map(convert),
    params: (node.params ? node.params : []).map(convert),
    expr: convert(node.evaluator(...(node.params ? node.params : []))),
  };
}

function convertCall(node: CallStatementNode): NativeCallStatementNode {
  return {
    type: node.type,
    nodeId: node.nodeId,
    args: (node.args ? node.args : []).map(convert),
    callback: node.callback || ((args: number[]) => {}),
  };
}

function convertBlock(node: BlockStatementNode): NativeBlockStatementNode {
  return {
    type: node.type,
    nodeId: node.nodeId,
    nodes: (node.nodes ? node.nodes : []).map(convert),
  };
}

function convertSet(node: SetStatementNode): NativeSetStatementNode {
  if (!node.target || !node.target.getTag) {
    throw Error('Missing target animated value in set expression.');
  }
  return {
    type: node.type,
    nodeId: node.nodeId,
    target: node.target && node.target.getTag && node.target.getTag(),
    source: convert(node.source),
  };
}

function convertCondition(node: CondStatementNode): NativeCondStatementNode {
  return {
    type: node.type,
    nodeId: node.nodeId,
    expr: convert(node.expr),
    ifNode: convert(node.ifNode),
    elseNode: convert(node.elseNode),
  };
}

function multi(node: MultiExpressionNode): NativeMultiExpressionNode {
  return {
    type: node.type,
    nodeId: node.nodeId,
    a: convert(node.a),
    b: convert(node.b),
    others: (node.others || []).map(convert),
  };
}

function unary(node: UnaryExpressionNode): NativeUnaryExpressionNode {
  return {
    type: node.type,
    nodeId: node.nodeId,
    v: convert(node.v),
  };
}

function boolean(node: BooleanExpressionNode): NativeBooleanExpressionNode {
  return {
    type: node.type,
    nodeId: node.nodeId,
    left: convert(node.left),
    right: convert(node.right),
  };
}

function animatedValue(
  node: AnimatedValueExpressionNode,
): NativeAnimatedValueExpressionNode {
  const retVal = {
    type: node.type,
    nodeId: node.nodeId,
    tag: node.getTag && node.getTag(),
  };
  return retVal;
}

function convertNumber(node: NumberExpressionNode): NativeNumberExpressionNode {
  return {type: node.type, nodeId: node.nodeId, value: node.value};
}

export {converters};
