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

const Animation = require('./Animation');

const {shouldUseNativeDriver} = require('../NativeAnimatedHelper');

import type AnimatedValue from '../nodes/AnimatedValue';
import type {AnimationConfig, EndCallback} from './Animation';

export type ClockAnimationConfig = AnimationConfig & {...};
export type ClockAnimationConfigSingle = AnimationConfig & {...};

class ClockAnimation extends Animation {
  _startTime: number;
  _lastValue: number;
  _fromValue: number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;
  _useNativeDriver: boolean;

  constructor(config: ClockAnimationConfigSingle) {
    super();
    this._useNativeDriver = shouldUseNativeDriver(config);
    this.__isInteraction = false;
    this.__iterations = 0;
  }

  __getNativeAnimationConfig(): {|
    type: $TEMPORARY$string<'clock'>,
  |} {
    return {
      type: 'clock',
    };
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
    animatedValue: AnimatedValue,
  ): void {
    this.__active = true;
    this._lastValue = fromValue;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;
    this._startTime = Date.now();
    if (this._useNativeDriver) {
      this.__startNativeAnimation(animatedValue);
    } else {
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }

  onUpdate(): void {
    const now = Date.now();
    this._onUpdate(now);
    this._lastValue = now;
    if (this.__active) {
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }

  stop(): void {
    super.stop();
    this.__active = false;
    global.cancelAnimationFrame(this._animationFrame);
    this.__debouncedOnEnd({finished: false});
  }
}

module.exports = ClockAnimation;
