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
const NativeAnimatedHelper = require('../NativeAnimatedHelper');

import type {InterpolationConfigType} from './AnimatedInterpolation';
import type {ExpressionNode} from './expressions';
import {createEvaluator, converters} from './expressions';

type CallCallbackListener = (args: number[]) => void;
let _uniqueId = 1;

class AnimatedExpression extends AnimatedWithChildren {
  _expression: ExpressionNode;
  _args: Array<any>;
  _evaluator: () => number;
  _callListeners: {[key: string]: CallCallbackListener, ...};
  _nativeCallCallbackListener: ?any;

  constructor(expression: ExpressionNode) {
    super();
    this._expression = expression;
    this._args = [];
    this._callListeners = {};
  }

  __attach() {
    collectArguments(this._expression, this._args);
    this._args.forEach(a =>
      typeof a !== 'function' ? a.node.__addChild(this) : this.__addListener(a),
    );
  }

  __detach() {
    this._args.forEach(
      a => typeof a !== 'function' && a.node.__removeChild(this),
    );
    this.__stopListeningToCallCallbacks();
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

  __makeNative() {
    super.__makeNative();
    this.__startListeningToCallCallbacks();
  }

  __addListener(callback: (args: number[]) => void): string {
    const id = String(_uniqueId++);
    this._callListeners[id] = callback;
    if (this.__isNative) {
      this.__startListeningToCallCallbacks();
    }
    return id;
  }

  __stopListeningToCallCallbacks() {
    if (!this._nativeCallCallbackListener) {
      return;
    }
    NativeAnimatedHelper.nativeEventEmitter.removeSubscription(
      this._nativeCallCallbackListener,
    );
    this._nativeCallCallbackListener = undefined;
  }

  __startListeningToCallCallbacks() {
    if (!this._nativeCallCallbackListener) {
      this._nativeCallCallbackListener = NativeAnimatedHelper.nativeEventEmitter.addListener(
        'onAnimatedCallback',
        data => {
          if (data.id !== this.__getNativeTag()) {
            return;
          }
          for (const key in this._callListeners) {
            this._callListeners[key](data.values);
          }
        },
      );
    }
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }
}

/* Arguments */
function collectArguments(
  node: ?(ExpressionNode | Function),
  args: Array<any>,
) {
  if (node) {
    if (typeof node === 'function') {
      args.push(node);
    } else if (node.type === 'value') {
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
    node.args && node.args.forEach(n => collectArguments(n, args));
    collectArguments(node.callback, args);
  }
}

module.exports = AnimatedExpression;
