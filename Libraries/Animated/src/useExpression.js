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
import {factories} from './nodes/expressions/factories';

function useExpression(
  expression: () => ExpressionNode | ExpressionNode[],
  deps?: Array<any>,
) {
  useEffect(() => {
    const node = expression();
    const expr =
      node instanceof Array
        ? new AnimatedExpression(
            factories.block(((node: any): Array<ExpressionNode>)),
          )
        : new AnimatedExpression(node);

    expr.__attach();

    return () => {
      expr.__detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

module.exports = useExpression;
