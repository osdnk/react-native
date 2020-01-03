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

import type {ExpressionNode, NativeExpressionNode} from './types';

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
  timing: convertTiming,
  spring: convertSpring,
  stopAnimation: convertStopAnimation,
};

function convert(v: ?(ExpressionNode | number)): ExpressionNode {
  if (v === undefined || v === null) {
    throw Error('Value not defined.');
  }
  if (typeof v === 'number') {
    return {type: 'number', value: v};
  }
  return converters[v.type](v);
}

function convertTiming(node: ExpressionNode): NativeExpressionNode {
  return {
    type: 'empty',
  };
}

function convertSpring(node: ExpressionNode): NativeExpressionNode {
  return {
    type: 'empty',
  };
}

function convertStopAnimation(node: ExpressionNode): NativeExpressionNode {
  return {
    type: 'empty',
  };
}

function convertProc(node: ExpressionNode): NativeExpressionNode {
  return {
    type: node.type,
    args: (node.args ? node.args : []).map(convert),
    params: (node.params ? node.params : []).map(convert),
    expr: convert(
      node.evaluator ? node.evaluator(...(node.params ? node.params : [])) : 0,
    ),
  };
}

function convertCall(node: ExpressionNode): NativeExpressionNode {
  return {
    type: node.type,
    args: (node.args ? node.args : []).map(convert),
    callback: node.callback || ((args: number[]) => {}),
  };
}

function convertBlock(node: ExpressionNode): NativeExpressionNode {
  return {
    type: node.type,
    nodes: (node.nodes ? node.nodes : []).map(convert),
  };
}

function convertSet(node: ExpressionNode): NativeExpressionNode {
  if (!node.target || !node.target.getTag) {
    throw Error('Missing target animated value in set expression.');
  }
  return {
    type: node.type,
    target: node.target && node.target.getTag && node.target.getTag(),
    source: convert(node.source),
  };
}

function convertCondition(node: ExpressionNode): NativeExpressionNode {
  return {
    type: node.type,
    expr: convert(node.expr),
    ifNode: convert(node.ifNode),
    elseNode: convert(node.elseNode),
  };
}

function multi(node: ExpressionNode): NativeExpressionNode {
  return {
    type: node.type,
    a: convert(node.a),
    b: convert(node.b),
    others: (node.others || []).map(convert),
  };
}

function unary(node: ExpressionNode): NativeExpressionNode {
  return {
    type: node.type,
    v: convert(node.v),
  };
}

function boolean(node: ExpressionNode): NativeExpressionNode {
  return {
    type: node.type,
    left: convert(node.left),
    right: convert(node.right),
  };
}

function animatedValue(node: ExpressionNode): NativeExpressionNode {
  const retVal = {
    type: node.type,
    tag: node.getTag && node.getTag(),
  };
  return retVal;
}

function convertNumber(node: ExpressionNode): NativeExpressionNode {
  return {type: node.type, value: node.value};
}

export {converters};
