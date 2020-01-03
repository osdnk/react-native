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

function useExpression(
  expression: () => ExpressionNode,
  deps: any[] = [],
  useNativeDriver: boolean = false,
) {
  useEffect(() => {
    const node = new AnimatedExpression(expression());
    node.__attach();

    if (useNativeDriver) {
      node.__makeNative();
    }

    return () => {
      node.__detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useNativeDriver].concat(deps));
}

module.exports = useExpression;
