/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import React from 'react';
import AnimatedNode from '../../AnimatedNode';
import AnimatedExpression from '../../AnimatedExpression';
import type {ExpressionNode} from '../types';

interface Props {
  exec: ExpressionNode;
  children?: () => AnimatedNode;
}

class Code extends React.PureComponent<Props> {
  static resolveNode: (
    maybeNode: Function | ExpressionNode,
  ) => ExpressionNode | null = (
    maybeNode: Function | ExpressionNode,
  ): ExpressionNode | null => {
    if (typeof maybeNode === 'function') {
      return Code.resolveNode(maybeNode());
    }

    return maybeNode;
  };

  expression: AnimatedExpression;

  componentDidMount() {
    const {children, exec} = this.props;
    const nodeChildren: ExpressionNode | null = Code.resolveNode(children);
    const nodeExec: ExpressionNode | null = Code.resolveNode(exec);

    const cantResolveNode = nodeChildren === null && nodeExec === null;

    if (cantResolveNode) {
      const error =
        nodeChildren === null
          ? `Got "${typeof children}" type passed to children`
          : `Got "${typeof exec}" type passed to exec`;

      throw new Error(
        `<Animated.Code /> expects the 'exec' prop or children to be an animated node or a function returning an animated node. ${error}`,
      );
    }

    // $FlowFixMe -
    this.expression = new AnimatedExpression(nodeExec || nodeChildren);
    this.expression.__attach();
  }

  componentWillUnmount() {
    this.expression.__detach();
  }

  componentDidUpdate() {
    this.componentWillUnmount();
    this.componentDidMount();
  }
  // $FlowFixMe -
  render() {
    return null;
  }
}
export default Code;
