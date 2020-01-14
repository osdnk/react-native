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

import {useEffect} from 'react';
import AnimatedExpression from './nodes/AnimatedExpression';

import type {ExpressionNode} from './nodes/expressions';

function useExpression(expression: () => ExpressionNode) {
  useEffect(() => {
    const node = new AnimatedExpression(expression());
    node.__attach();

    return () => {
      node.__detach();
    };
  }, [expression]);
}

module.exports = useExpression;
