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
const invariant = require('invariant');
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
  FormatExpressionNode,
  CastBooleanExpressionNode,
  ExpressionParam,
  StartTimingAnimationNodeConfig,
  StartTimingStatementNode,
  StartSpringStatementNode,
  StartDecayStatementNode,
  StartClockStatementNode,
  StopClockStatementNode,
  StopAnimationStatementNode,
  ClockRunningExpressionNode,
  BezierExpressionNode,
} from './types';

type MultiFactory = (
  a: ExpressionParam,
  b: ExpressionParam,
  ...args: Array<ExpressionParam>
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
  ...args: Array<ExpressionNode | Array<ExpressionNode>>
) => BlockStatementNode;

type CallFactory = (
  args: ExpressionParam | ExpressionParam[],
  (args: number[]) => void,
) => CallStatementNode;

type FormatFactory = (
  formatStr: string,
  ...args: ExpressionParam[]
) => FormatExpressionNode;

type CastBooleanFactory = (v: ExpressionParam) => CastBooleanExpressionNode;

type StartSpringFactoryConfig = {
  toValue: number | AnimatedValue,
  overshootClamping?: boolean,
  restDisplacementThreshold?: number,
  restSpeedThreshold?: number,
  velocity?: ExpressionParam,
  bounciness?: number,
  speed?: number,
  tension?: number,
  friction?: number,
  stiffness?: number,
  damping?: number,
  mass?: number,
  delay?: number,
  iterations?: number,
};

type StartTimingAnimationFactory = (
  v: AnimatedValue,
  config: StartTimingAnimationNodeConfig,
  callback: ?ExpressionNode,
) => StartTimingStatementNode;

type StartSpringAnimationFactory = (
  v: AnimatedValue,
  config: StartSpringFactoryConfig,
  callback: ?ExpressionNode,
) => StartSpringStatementNode;

type StartDecayFactoryConfig = {
  velocity: ExpressionParam,
  deceleration?: number,
  iterations?: number,
};

type StartDecayAnimationFactory = (
  v: AnimatedValue,
  config: StartDecayFactoryConfig,
  callback: ?ExpressionNode,
) => StartDecayStatementNode;

type StopAnimationFactory = (
  animationId: ExpressionParam,
) => StopAnimationStatementNode;

type StartClockAnimationFactory = (
  v: AnimatedValue,
  callback: ?ExpressionNode,
) => StartClockStatementNode;

type ClockRunningFactory = (v: AnimatedValue) => ClockRunningExpressionNode;

type StopClockAnimationFactory = (v: AnimatedValue) => StopClockStatementNode;

type BezierExpressionFactory = (
  t: ExpressionNode,
  mX1: number,
  mY1: number,
  mX2: number,
  mY2: number,
) => BezierExpressionNode;

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
const diff: UnaryFactory = unary('diff');
const format: FormatFactory = formatFactory;
const castBoolean: CastBooleanFactory = castBooleanFactory;
const startTiming: StartTimingAnimationFactory = timingFactory;
const startSpring: StartSpringAnimationFactory = springFactory;
const startDecay: StartDecayAnimationFactory = decayFactory;
const startClock: StartClockAnimationFactory = startClockFactory;
const stopClock: StopClockAnimationFactory = stopClockFactory;
const clockRunning: ClockRunningFactory = clockRunningFactory;
const animationRunning: ClockRunningFactory = clockRunningFactory;
const stopAnimation: StopAnimationFactory = stopAnimationFactory;
const bezier: BezierExpressionFactory = bezierFactory;

export function resolve(v: ExpressionParam): ExpressionNode {
  if (v instanceof Array) {
    return block(v);
  }
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

const invariantParam = (condition: any, param: string, funcName: string) =>
  invariant(
    condition !== undefined,
    `${param} is a required parameter for ${funcName}.`,
  );

function bezierFactory(
  t: ExpressionNode,
  mX1: number,
  mY1: number,
  mX2: number,
  mY2: number,
): BezierExpressionNode {
  invariantParam(t, 'Value', 'bezier');
  return {
    type: 'bezier',
    v: t,
    nodeId: _nodeId++,
    mX1,
    mY1,
    mX2,
    mY2,
  };
}

function timingFactory(
  v: AnimatedValue,
  config: StartTimingAnimationNodeConfig,
  callback: ?ExpressionNode,
): StartTimingStatementNode {
  invariantParam(v, 'Value', 'startTiming');
  invariantParam(config, 'Config', 'startTiming');
  return {
    type: 'startTiming',
    nodeId: _nodeId++,
    target: ((resolve(v): any): AnimatedValueExpressionNode),
    config: config,
    callback: callback || null,
  };
}

function springFactory(
  v: AnimatedValue,
  config: StartSpringFactoryConfig,
  callback: ?ExpressionNode,
): StartSpringStatementNode {
  invariantParam(v, 'Value', 'startSpring');
  invariantParam(config, 'Config', 'startSpring');
  return {
    type: 'startSpring',
    nodeId: _nodeId++,
    target: ((resolve(v): any): AnimatedValueExpressionNode),
    config: {
      ...config,
      velocity:
        config.velocity !== undefined ? resolve(config.velocity) : resolve(0),
    },
    callback: callback || null,
  };
}

function decayFactory(
  v: AnimatedValue,
  config: StartDecayFactoryConfig,
  callback: ?ExpressionNode,
): StartDecayStatementNode {
  invariantParam(v, 'Value', 'startDecay');
  invariantParam(config, 'Config', 'startDecay');
  return {
    type: 'startDecay',
    nodeId: _nodeId++,
    target: ((resolve(v): any): AnimatedValueExpressionNode),
    config: {
      velocity: resolve(config.velocity),
      deceleration: config.deceleration,
      iterations: config.iterations,
    },
    callback: callback || null,
  };
}

function stopAnimationFactory(
  animationId: ExpressionParam,
): StopAnimationStatementNode {
  invariantParam(animationId, 'AnimationId ', 'stopAnimation');
  return {
    type: 'stopAnimation',
    nodeId: _nodeId++,
    animationId: resolve(animationId),
  };
}

function startClockFactory(
  v: AnimatedValue,
  callback: ?ExpressionNode,
): StartClockStatementNode {
  invariantParam(v, 'Value', 'startClock');
  return {
    type: 'startClock',
    nodeId: _nodeId++,
    target: ((resolve(v): any): AnimatedValueExpressionNode),
    config: {
      useNativeDriver: false,
    },
    callback: callback || null,
  };
}

function stopClockFactory(v: AnimatedValue): StopClockStatementNode {
  invariantParam(v, 'Value', 'stopClock');
  return {
    type: 'stopClock',
    nodeId: _nodeId++,
    target: ((resolve(v): any): AnimatedValueExpressionNode),
  };
}

function clockRunningFactory(v: AnimatedValue): ClockRunningExpressionNode {
  invariantParam(v, 'Value', 'clockRunning');
  return {
    type: 'clockRunning',
    nodeId: _nodeId++,
    target: ((resolve(v): any): AnimatedValueExpressionNode),
  };
}

function formatFactory(
  formatStr: string,
  ...args: ExpressionParam[]
): FormatExpressionNode {
  invariantParam(formatStr, 'Format string', 'format');
  return {
    type: 'format',
    nodeId: _nodeId++,
    format: formatStr,
    args: args.map(resolve),
  };
}

function castBooleanFactory(v: ExpressionParam): CastBooleanExpressionNode {
  invariantParam(v, 'Expression', 'boolean');
  return {
    type: 'castBoolean',
    nodeId: _nodeId++,
    v: resolve(v),
  };
}

function setFactory(
  target: AnimatedValue,
  source: ExpressionParam,
): SetStatementNode {
  invariantParam(target, 'Target', 'set');
  invariantParam(source, 'Source', 'set');
  return {
    type: 'set',
    nodeId: _nodeId++,
    target: ((resolve(target): any): AnimatedValueExpressionNode),
    source: resolve(source),
  };
}

function blockFactory(
  ...args: Array<ExpressionNode | Array<ExpressionNode>>
): BlockStatementNode {
  return {
    type: 'block',
    nodeId: _nodeId++,
    args: args.map(n => (Array.isArray(n) ? blockFactory(...n) : resolve(n))),
  };
}

function condFactory(
  expr: ExpressionParam,
  ifNode: ExpressionParam | ExpressionParam[],
  elseNode: ?(ExpressionParam | ExpressionParam[]),
): CondStatementNode {
  invariantParam(expr, 'Expression', 'cond');
  invariantParam(ifNode, 'If expression', 'cond');
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
  invariantParam(args, 'Arguments', 'call');
  invariantParam(callback, 'Callback', 'call');
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
    ...args: Array<ExpressionParam>
  ) => {
    invariantParam(a1, 'a', type);
    invariantParam(b1, 'b', type);
    return {
      type,
      nodeId: _nodeId++,
      a: resolve(a1),
      b: resolve(b1),
      args: args.map(resolve),
    };
  };
}

function boolean(type: string): BooleanFactory {
  return (left: ExpressionParam, right: ExpressionParam) => {
    invariantParam(left, 'left', type);
    invariantParam(right, 'right', type);
    return {
      type,
      nodeId: _nodeId++,
      left: resolve(left),
      right: resolve(right),
    };
  };
}

function unary(type: string): UnaryFactory {
  return (v: ExpressionParam) => {
    invariantParam(v, 'Value', type);
    return {
      type,
      nodeId: _nodeId++,
      v: resolve(v),
    };
  };
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
  format,
  boolean: castBoolean,
  startTiming,
  startSpring,
  startDecay,
  startClock,
  stopClock,
  clockRunning,
  animationRunning,
  stopAnimation,
  diff,
  bezier,
};
