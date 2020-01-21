/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {FormatExpressionNode, ExpressionParam} from '../types';
import {factories} from '../factories';

export function concat(...args: ExpressionParam[]): FormatExpressionNode {
  const formatStr = args.map(a => (typeof a === 'string' ? a : '%f')).join('');
  return factories.format(
    formatStr,
    ...args.filter(a => typeof a !== 'string'),
  );
}
