/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type AnimatedValue from '../../AnimatedValue';
import type AnimatedNode from '../../AnimatedNode';
import type {AnimatedClock} from '../derived/Clock';
import type {ExpressionNode, BlockStatementNode} from '../types';

import {factories} from '../factories';
const {block, cond, add, set, greaterOrEq, multiply, sub, divide} = factories;

type TimingState = {
  time: AnimatedValue,
  frameTime: AnimatedValue,
  position: AnimatedValue,
  finished: AnimatedValue,
};

type TimingConfig = {
  duration: AnimatedNode | number,
  toValue: AnimatedNode | number,
  easing: (t: ExpressionNode) => ExpressionNode,
};

const internalTiming = function(
  clock,
  time,
  frameTime,
  position,
  finished,
  toValue,
  duration,
  nextProgress,
  progress,
  newFrameTime,
) {
  const state = {
    time,
    finished,
    frameTime,
    position,
  };

  const config = {
    duration,
    toValue,
  };

  const distanceLeft = sub(config.toValue, state.position);
  const fullDistance = divide(distanceLeft, sub(1, progress));
  const startPosition = sub(config.toValue, fullDistance);
  const nextPosition = add(startPosition, multiply(fullDistance, nextProgress));

  return block([
    cond(
      greaterOrEq(newFrameTime, config.duration),
      [set(state.position, config.toValue), set(state.finished, 1)],
      set(state.position, nextPosition),
    ),
    set(state.frameTime, newFrameTime),
    set(state.time, clock),
  ]);
};

function timing(
  clock: AnimatedClock,
  state: TimingState,
  config: TimingConfig,
): BlockStatementNode {
  const lastTime = cond(state.time, state.time, clock);
  const newFrameTime = add(state.frameTime, sub(clock, lastTime));
  const nextProgress = config.easing(divide(newFrameTime, config.duration));
  const progress = config.easing(divide(state.frameTime, config.duration));
  return internalTiming(
    clock,
    state.time,
    state.frameTime,
    state.position,
    state.finished,
    config.toValue,
    config.duration,
    nextProgress,
    progress,
    newFrameTime,
  );
}

export {timing};
