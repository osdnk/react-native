/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const AnimatedValue = require('../AnimatedValue');
let _nodeId = 0;

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
  FormatExpressionNode,
  CastBooleanExpressionNode,
  ExpressionParam,
} from './types';

type MultiFactory = (
  a: ExpressionParam,
  b: ExpressionParam,
  ...others: Array<ExpressionParam>
) => MultiExpressionNode;

type UnaryFactory = (v: ExpressionParam) => UnaryExpressionNode;

type BooleanFactory = (
  left: ExpressionParam,
  right: ExpressionParam,
) => BooleanExpressionNode;

type ConditionFactory = (
  expr: ExpressionParam,
  ifNode: ExpressionParam | ExpressionParam[],
  elseNode: ?(ExpressionParam | ExpressionParam[]),
) => CondStatementNode;

type SetFactory = (
  target: AnimatedValue,
  source: ExpressionParam,
) => SetStatementNode;

type BlockFactory = (
  ...nodes: Array<ExpressionParam | Array<ExpressionParam>>
) => BlockStatementNode;

type CallFactory = (
  args: ExpressionParam | ExpressionParam[],
  (args: number[]) => void,
) => CallStatementNode;

type ProcFactory = (
  evaluator: (...args: ExpressionParam[]) => ExpressionNode,
) => (...args: ExpressionParam[]) => ProcStatementNode;

type FormatFactory = (
  formatStr: string,
  ...args: ExpressionParam[]
) => FormatExpressionNode;

type CastBooleanFactory = (v: ExpressionParam) => CastBooleanExpressionNode;

const add: MultiFactory = multi('add');
const sub: MultiFactory = multi('sub');
const multiply: MultiFactory = multi('multiply');
const divide: MultiFactory = multi('divide');
const pow: MultiFactory = multi('pow');
const modulo: MultiFactory = multi('modulo');
const max: MultiFactory = multi('max');
const min: MultiFactory = multi('min');
const abs: UnaryFactory = unary('abs');
const sqrt: UnaryFactory = unary('sqrt');
const log: UnaryFactory = unary('log');
const sin: UnaryFactory = unary('sin');
const cos: UnaryFactory = unary('cos');
const tan: UnaryFactory = unary('tan');
const acos: UnaryFactory = unary('acos');
const asin: UnaryFactory = unary('asin');
const atan: UnaryFactory = unary('atan');
const exp: UnaryFactory = unary('exp');
const round: UnaryFactory = unary('round');
const ceil: UnaryFactory = unary('ceil');
const floor: UnaryFactory = unary('floor');
const and: MultiFactory = multi('and');
const or: MultiFactory = multi('or');
const not: UnaryFactory = unary('not');
const eq: BooleanFactory = boolean('eq');
const neq: BooleanFactory = boolean('neq');
const lessThan: BooleanFactory = boolean('lessThan');
const greaterThan: BooleanFactory = boolean('greaterThan');
const lessOrEq: BooleanFactory = boolean('lessOrEq');
const greaterOrEq: BooleanFactory = boolean('greaterOrEq');
const cond: ConditionFactory = condFactory;
const set: SetFactory = setFactory;
const block: BlockFactory = blockFactory;
const call: CallFactory = callFactory;
const proc: ProcFactory = procFactory;
const format: FormatFactory = formatFactory;
const castBoolean: CastBooleanFactory = castBooleanFactory;

function resolve(v: ExpressionParam): ExpressionNode {
  if (v instanceof Object) {
    // Expression ExpressionNode
    if (v.hasOwnProperty('type')) {
      return ((v: any): ExpressionNode);
    }
    // Animated value / node
    return ({
      type: 'value',
      nodeId: _nodeId++,
      node: v,
      getTag: v.__getNativeTag.bind(v),
      getValue: v.__getValue.bind(v),
      // $FlowFixMe
      setValue: (value: number) => (((v: any): AnimatedValue)._value = value),
    }: AnimatedValueExpressionNode);
  } else {
    // Number
    return ({
      type: 'number',
      nodeId: _nodeId++,
      value: ((v: any): number),
    }: NumberExpressionNode);
  }
}

function formatFactory(
  formatStr: string,
  ...args: ExpressionParam[]
): FormatExpressionNode {
  return {
    type: 'format',
    nodeId: _nodeId++,
    format: formatStr,
    args: args.map(resolve),
  };
}

function castBooleanFactory(v: ExpressionParam): CastBooleanExpressionNode {
  return {
    type: 'castBoolean',
    nodeId: _nodeId++,
    v: resolve(v),
  };
}

function procFactory(
  evaluator: (...args: ExpressionParam[]) => ExpressionNode,
): (...args: ExpressionParam[]) => ProcStatementNode {
  const params = new Array(evaluator.length);
  for (let i = 0; i < params.length; i++) {
    params[i] = new AnimatedValue(0);
  }
  return (...nodes: ExpressionParam[]) => ({
    type: 'callProc',
    nodeId: _nodeId++,
    args: nodes.map(resolve),
    params: params.map(resolve),
    evaluator,
  });
}

function setFactory(
  target: AnimatedValue,
  source: ExpressionParam,
): SetStatementNode {
  return {
    type: 'set',
    nodeId: _nodeId++,
    target: ((resolve(target): any): AnimatedValueExpressionNode),
    source: resolve(source),
  };
}

function blockFactory(
  ...nodes: Array<ExpressionParam | Array<ExpressionParam>>
): BlockStatementNode {
  return {
    type: 'block',
    nodeId: _nodeId++,
    nodes: nodes.map(n => (Array.isArray(n) ? blockFactory(...n) : resolve(n))),
  };
}

function condFactory(
  expr: ExpressionParam,
  ifNode: ExpressionParam | ExpressionParam[],
  elseNode: ?(ExpressionParam | ExpressionParam[]),
): CondStatementNode {
  return {
    type: 'cond',
    nodeId: _nodeId++,
    expr: resolve(expr),
    ifNode:
      ifNode instanceof Array
        ? blockFactory(ifNode.map(resolve))
        : resolve(ifNode),
    elseNode: elseNode
      ? elseNode instanceof Array
        ? blockFactory(elseNode.map(resolve))
        : resolve(elseNode)
      : resolve(0),
  };
}

function callFactory(
  args: ExpressionParam | ExpressionParam[],
  callback: (args: number[]) => void,
): CallStatementNode {
  return {
    type: 'call',
    nodeId: _nodeId++,
    args:
      args instanceof Array
        ? args.map(resolve)
        : [resolve((args: ExpressionParam))],
    callback,
  };
}

function multi(type: string): MultiFactory {
  return (
    a1: ExpressionParam,
    b1: ExpressionParam,
    ...others: Array<ExpressionParam>
  ) => ({
    type,
    nodeId: _nodeId++,
    a: resolve(a1),
    b: resolve(b1),
    others: others.map(resolve),
  });
}

function boolean(type: string): BooleanFactory {
  return (left: ExpressionParam, right: ExpressionParam) => ({
    type,
    nodeId: _nodeId++,
    left: resolve(left),
    right: resolve(right),
  });
}

function unary(type: string): UnaryFactory {
  return (v: ExpressionParam) => ({
    type,
    nodeId: _nodeId++,
    v: resolve(v),
  });
}

export const factories = {
  add,
  sub,
  divide,
  multiply,
  pow,
  modulo,
  max,
  min,
  abs,
  sqrt,
  log,
  sin,
  cos,
  tan,
  acos,
  asin,
  atan,
  exp,
  round,
  ceil,
  floor,
  and,
  or,
  not,
  eq,
  neq,
  lessThan,
  greaterThan,
  lessOrEq,
  greaterOrEq,
  cond,
  set,
  block,
  call,
  proc,
  format,
  boolean: castBoolean,
};
