/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableMap;

/**
 * Implementation of {@link AnimationDriver} providing support for decay animations. The
 * implementation is copied from the JS version in {@code AnimatedImplementation.js}.
 */
public class ClockAnimation extends AnimationDriver {

  public ClockAnimation(ReadableMap config) {
    resetConfig(config);
  }

  @Override
  public void resetConfig(ReadableMap config) {

  }

  @Override
  public void runAnimationStep(long frameTimeNanos) {
    long frameTimeMillis = frameTimeNanos / 1000000;
    mAnimatedValue.mValue = frameTimeMillis;
  }
}
