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

const AnimatedInterpolation = require('./AnimatedInterpolation');
const AnimatedWithChildren = require('./AnimatedWithChildren');

import type {InterpolationConfigType} from './AnimatedInterpolation';
import type {ExpressionNode} from './expressions';
import {createEvaluator, converters} from './expressions';

class AnimatedExpression extends AnimatedWithChildren {
  _expression: ExpressionNode;
  _args: Array<any>;
  _evaluator: () => number;

  constructor(expression: ExpressionNode) {
    super();
    this._expression = expression;
    this._args = [];
  }

  __attach() {
    collectArguments(this._expression, this._args);
    this._args.forEach(a => a.node.__addChild(this));
  }

  __detach() {
    this._args.forEach(a => a.node.__removeChild(this));
    super.__detach();
  }

  __getValue(): number {
    if (!this._evaluator) {
      this._evaluator = createEvaluator(this._expression);
    }
    return this._evaluator();
  }

  __getNativeConfig(): any {
    return {
      type: 'expression',
      graph: converters[this._expression.type](this._expression),
    };
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }
}

/* Arguments */
function collectArguments(node: ?Object, args: Array<any>) {
  if (node) {
    if (node.type === 'value') {
      args.push(node);
    }
    collectArguments(node.a, args);
    collectArguments(node.b, args);
    collectArguments(node.left, args);
    collectArguments(node.right, args);
    collectArguments(node.expr, args);
    collectArguments(node.ifNode, args);
    collectArguments(node.elseNode, args);
    collectArguments(node.target, args);
    collectArguments(node.source, args);
    node.others && node.others.forEach(n => collectArguments(n, args));
    node.nodes && node.nodes.forEach(n => collectArguments(n, args));
  }
}

module.exports = AnimatedExpression;
