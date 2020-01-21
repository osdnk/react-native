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
import type {AnimatedClock} from '../compatibility';
import type {BlockStatementNode} from '../types';

import {factories} from '../factories';
const {
  block,
  cond,
  add,
  set,
  greaterOrEq,
  round,
  multiply,
  sub,
  divide,
} = factories;

type TimingState = {
  time: AnimatedValue,
  frameTime: AnimatedValue,
  position: AnimatedValue,
  finished: AnimatedValue,
};

type TimingConfig = {
  duration: AnimatedNode | number,
  toValue: AnimatedNode | number,
  easing: (t: number) => number,
  frames?: number[],
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
  if (!config.frames) {
    const frameDuration = 1000.0 / 60.0;
    const frames = [];
    const numFrames = round(divide(config.duration, frameDuration));
    for (let frame = 0; frame < numFrames; frame++) {
      frames.push(config.easing(frame / numFrames));
    }
    frames.push(this._easing(1));
    config.frames = frames;
  }

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
