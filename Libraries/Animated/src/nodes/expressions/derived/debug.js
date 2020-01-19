/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {
  BlockStatementNode,
  ExpressionParam,
  NumberExpressionNode,
} from '../types';
import {factories, resolve} from '../factories';
const {block, call} = factories;

export function debug(
  message: string,
  node: ExpressionParam,
): BlockStatementNode | NumberExpressionNode {
  if (__DEV__) {
    return block(
      call([node], (args: number[]) => {
        console.info(message, args[0]);
      }),
      resolve(node),
    );
  } else {
    return ((resolve(0): any): NumberExpressionNode);
  }
}
