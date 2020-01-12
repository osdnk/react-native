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

import type {TimingAnimationConfig} from '../../animations/TimingAnimation';
import type {SpringAnimationConfig} from '../../animations/SpringAnimation';
import type {ClockAnimationConfig} from '../../animations/ClockAnimation';

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
  args: ExpressionNode[],
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
  args: ExpressionNode[],
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

export type FormatExpressionNode = {
  ...BaseExpressionNode,
  format: string,
  args: ExpressionNode[],
};

export type CastBooleanExpressionNode = {
  ...BaseExpressionNode,
  v: ExpressionNode,
};

export type StartTimingStatementNode = {
  ...BaseExpressionNode,
  target: AnimatedValueExpressionNode,
  config: TimingAnimationConfig,
  callback: ExpressionNode | null,
};

export type StartSpringStatementNode = {
  ...BaseExpressionNode,
  target: AnimatedValueExpressionNode,
  config: SpringAnimationConfig,
  callback: ExpressionNode | null,
};

export type StartDecayAnimationNodeConfig = {
  velocity: ExpressionNode,
  deceleration?: number,
};

export type StartDecayStatementNode = {
  ...BaseExpressionNode,
  target: AnimatedValueExpressionNode,
  config: StartDecayAnimationNodeConfig,
  callback: ExpressionNode | null,
};

export type StartClockStatementNode = {
  ...BaseExpressionNode,
  target: AnimatedValueExpressionNode,
  config: ClockAnimationConfig,
  callback: ExpressionNode | null,
};

export type StopClockStatementNode = {
  ...BaseExpressionNode,
  target: AnimatedValueExpressionNode,
};

export type StopAnimationStatementNode = {
  ...BaseExpressionNode,
  animationId: ExpressionNode,
};

export type ClockRunningExpressionNode = {
  ...BaseExpressionNode,
  target: AnimatedValueExpressionNode,
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
  | StartTimingStatementNode
  | StartSpringStatementNode
  | StartDecayStatementNode
  | StartClockStatementNode
  | StopClockStatementNode
  | ClockRunningExpressionNode
  | StopAnimationStatementNode;

export type NativeMultiExpressionNode = {
  ...BaseExpressionNode,
  a: NativeExpressionNode,
  b: NativeExpressionNode,
  args: NativeExpressionNode[],
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
  args: NativeExpressionNode[],
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

export type NativeFormatExpressionNode = {
  ...BaseExpressionNode,
  format: string,
  args: NativeExpressionNode[],
};

export type NativeCastBooleanExpressionNode = {
  ...BaseExpressionNode,
  v: NativeExpressionNode,
};

export type NativeStartTimingStatementNode = {
  ...BaseExpressionNode,
  target: number,
  config: {type: 'frames', frames: [], toValue: number, iterations: number},
  callback: NativeExpressionNode | null,
};

export type NativeStartSpringStatementNode = {
  ...BaseExpressionNode,
  target: number,
  config: {
    type: 'spring',
    overshootClamping: boolean,
    restDisplacementThreshold: number,
    restSpeedThreshold: number,
    stiffness: number,
    damping: number,
    mass: number,
    initialVelocity: number,
    toValue: number,
    iterations: number,
  },
  callback: NativeExpressionNode | null,
};

export type NativeStartDecayStatementNode = {
  ...BaseExpressionNode,
  target: number,
  config: {
    type: 'decay',
    deceleration: number,
    velocity: NativeExpressionNode,
  },
  callback: NativeExpressionNode | null,
};

export type NativeStopAnimationStatementNode = {
  ...BaseExpressionNode,
  animationId: NativeExpressionNode,
};

export type NativeStartClockStatementNode = {
  ...BaseExpressionNode,
  target: number,
  config: {
    type: 'clock',
  },
  callback: NativeExpressionNode | null,
};

export type NativeStopClockStatementNode = {
  ...BaseExpressionNode,
  target: number,
};

export type NativeClockRunningExpressionNode = {
  ...BaseExpressionNode,
  target: number,
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
  | NativeFormatExpressionNode
  | NativeCastBooleanExpressionNode
  | NativeStartTimingStatementNode
  | NativeStartSpringStatementNode
  | NativeStartDecayStatementNode
  | NativeStartClockStatementNode
  | NativeStopClockStatementNode
  | NativeClockRunningExpressionNode
  | NativeStopAnimationStatementNode;
