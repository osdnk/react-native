/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const AnimatedValue = require('../../AnimatedValue');

class AnimatedClock extends AnimatedValue {
  constructor() {
    super(0);
  }
}

export {AnimatedClock};
