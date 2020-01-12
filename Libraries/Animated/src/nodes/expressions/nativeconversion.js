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
  FormatExpressionNode,
  CastBooleanExpressionNode,
  StartTimingStatementNode,
  StartSpringStatementNode,
  StartDecayStatementNode,
  StopAnimationStatementNode,
  StartClockStatementNode,
  StopClockStatementNode,
  ClockRunningExpressionNode,
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
  NativeFormatExpressionNode,
  NativeCastBooleanExpressionNode,
  NativeStartTimingStatementNode,
  NativeStartSpringStatementNode,
  NativeStartDecayStatementNode,
  NativeStopAnimationStatementNode,
  NativeStartClockStatementNode,
  NativeStopClockStatementNode,
  NativeClockRunningExpressionNode,
} from './types';

import TimingAnimation from '../../animations/TimingAnimation';
import SpringAnimation from '../../animations/SpringAnimation';
import DecayAnimation from '../../animations/DecayAnimation';
import ClockAnimation from '../../animations/ClockAnimation';

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
  format: convertFormat,
  castBoolean: convertCastBoolean,
  startTiming: convertTiming,
  startSpring: convertSpring,
  startDecay: convertDecay,
  stopAnimation: convertStopAnimation,
  startClock: convertStartClock,
  stopClock: convertStopClock,
  clockRunning: convertClockRunning,
  diff: unary,
};

function convert(v: ?ExpressionNode): NativeExpressionNode {
  if (v === undefined || v === null) {
    throw Error('Value not defined.');
  }
  if (converters[v.type] === null) {
    throw Error('Native converter for ' + v.type + ' was not found.');
  }
  return converters[v.type](v);
}

function convertStartClock(
  node: StartClockStatementNode,
): NativeStartClockStatementNode {
  return {
    type: 'startClock',
    nodeId: node.nodeId,
    target: node.target && node.target.getTag && node.target.getTag(),
    config: new ClockAnimation((node.config: any)).__getNativeAnimationConfig(),
    callback: node.callback ? convert(node.callback) : null,
  };
}

function convertStopClock(
  node: StopClockStatementNode,
): NativeStopClockStatementNode {
  return {
    type: 'stopClock',
    nodeId: node.nodeId,
    target: node.target && node.target.getTag && node.target.getTag(),
  };
}

function convertClockRunning(
  node: ClockRunningExpressionNode,
): NativeClockRunningExpressionNode {
  return {
    type: 'clockRunning',
    nodeId: node.nodeId,
    target: node.target && node.target.getTag && node.target.getTag(),
  };
}

function convertTiming(
  node: StartTimingStatementNode,
): NativeStartTimingStatementNode {
  return {
    type: 'startTiming',
    nodeId: node.nodeId,
    target: node.target && node.target.getTag && node.target.getTag(),
    config: new TimingAnimation(
      (node.config: any),
    ).__getNativeAnimationConfig(),
    callback: node.callback ? convert(node.callback) : null,
  };
}

function convertSpring(
  node: StartSpringStatementNode,
): NativeStartSpringStatementNode {
  return {
    type: 'startSpring',
    nodeId: node.nodeId,
    target: node.target && node.target.getTag && node.target.getTag(),
    config: new SpringAnimation(
      (node.config: any),
    ).__getNativeAnimationConfig(),
    callback: node.callback ? convert(node.callback) : null,
  };
}

function convertDecay(
  node: StartDecayStatementNode,
): NativeStartDecayStatementNode {
  return {
    type: 'startDecay',
    nodeId: node.nodeId,
    target: node.target && node.target.getTag && node.target.getTag(),
    config: {
      type: 'decay',
      velocity: convert(node.config.velocity),
      deceleration: node.config.deceleration ?? 0.998,
    },
    callback: node.callback ? convert(node.callback) : null,
  };
}

function convertStopAnimation(
  node: StopAnimationStatementNode,
): NativeStopAnimationStatementNode {
  return {
    type: 'stopAnimation',
    nodeId: node.nodeId,
    animationId: convert(node.animationId),
  };
}

function convertFormat(node: FormatExpressionNode): NativeFormatExpressionNode {
  return {
    type: node.type,
    nodeId: node.nodeId,
    format: node.format,
    args: (node.args ? node.args : []).map(convert),
  };
}

function convertCastBoolean(
  node: CastBooleanExpressionNode,
): NativeCastBooleanExpressionNode {
  return {
    type: node.type,
    nodeId: node.nodeId,
    v: convert(node.v),
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
    args: node.args.map(convert),
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
    args: node.args.map(convert),
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
