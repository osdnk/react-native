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

const AnimatedNode = require('../AnimatedNode');
const AnimatedValue = require('../AnimatedValue');

import type {ExpressionNode, ExpressionParam} from './types';

type MultiFactory = (
  a: ExpressionParam,
  b: ExpressionParam,
  ...others: Array<ExpressionParam>
) => ExpressionNode;

type UnaryFactory = (v: ExpressionParam) => ExpressionNode;
type BooleanFactory = (
  left: ExpressionParam,
  right: ExpressionParam,
) => ExpressionNode;

type ConditionFactory = (
  expr: ExpressionParam,
  ifNode: ExpressionParam | ExpressionParam[],
  elseNode: ?(ExpressionParam | ExpressionParam[]),
) => ExpressionNode;

type SetFactory = (
  target: AnimatedValue,
  source: ExpressionParam,
) => ExpressionNode;

type BlockFactory = (
  ...nodes: Array<ExpressionNode | Array<ExpressionNode>>
) => ExpressionNode;

const add: MultiFactory = multi('add');
const sub: MultiFactory = multi('sub');
const multiply: MultiFactory = multi('multiply');
const divide: MultiFactory = multi('divide');
const pow: MultiFactory = multi('pow');
const modulo: MultiFactory = multi('modulo');
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

function resolve(
  v: AnimatedNode | AnimatedValue | ExpressionNode | number,
): ExpressionNode {
  if (v instanceof Object) {
    // Expression ExpressionNode
    if (v.hasOwnProperty('type')) {
      return ((v: any): ExpressionNode);
    }
    // Animated value / node
    return {
      type: 'value',
      node: v,
      getTag: v.__getNativeTag.bind(v),
      getValue: v.__getValue.bind(v),
      // $FlowFixMe
      setValue: (value: number) => (((v: any): AnimatedValue)._value = value),
    };
  } else {
    // Number
    return {type: 'number', value: ((v: any): number)};
  }
}

function setFactory(
  target: AnimatedValue,
  source: ExpressionParam,
): ExpressionNode {
  return {
    type: 'set',
    target: ((resolve(target): any): ExpressionNode),
    source: resolve(source),
  };
}

function blockFactory(
  ...nodes: Array<ExpressionNode | Array<ExpressionNode>>
): ExpressionNode {
  return {
    type: 'block',
    nodes: nodes.map(n => (Array.isArray(n) ? blockFactory(...n) : resolve(n))),
  };
}

function condFactory(
  expr: ExpressionParam,
  ifNode: ExpressionParam | ExpressionParam[],
  elseNode: ?(ExpressionParam | ExpressionParam[]),
): ExpressionNode {
  return {
    type: 'cond',
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

function multi(type: string): MultiFactory {
  return (
    a: ExpressionParam,
    b: ExpressionParam,
    ...others: Array<ExpressionParam>
  ) => ({
    type,
    a: resolve(a),
    b: resolve(b),
    others: others.map(resolve),
  });
}

function boolean(type: string): BooleanFactory {
  return (left: ExpressionParam, right: ExpressionParam) => ({
    type,
    left: resolve(left),
    right: resolve(right),
  });
}

function unary(type: string): UnaryFactory {
  return (v: ExpressionParam) => ({
    type,
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
};
