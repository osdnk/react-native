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

const AnimatedNode = require('./AnimatedNode');
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
  _params: Array<any>;
  _evaluator: () => number;
  _callListeners: {[key: string]: CallCallbackListener, ...};
  _nativeCallCallbackListener: ?any;

  constructor(expression: ExpressionNode) {
    super();
    this._expression = expression;
    this._args = [];
    this._params = [];
    this._callListeners = {};
  }

  __attach() {
    collectArguments(this._expression, this._args, this._params);
    // Collect arguments and add this node as a child to each argument
    this._args.forEach(a => {
      if (typeof a === 'function') {
        this.__addListener(a);
      } else {
        a.node.__addChild(this);
      }
    });
    this._params.forEach(p => p.node.__attach());
  }

  __detach() {
    this._args.forEach(
      a => typeof a !== 'function' && a.node.__removeChild(this),
    );
    this._params.forEach(p => p.node.__detach());
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
    this._params.forEach(p => p.node.__makeNative());
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
      try {
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
      } catch {}
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
  params: Array<any>,
) {
  if (node) {
    if (typeof node === 'function') {
      args.push(node);
    } else if (node.type === 'value') {
      args.push(node);
    } else if (node.type === 'callProc') {
      node.params && node.params.forEach(p => params.push(p));
      node.args && node.args.forEach(p => params.push(p));
      collectArguments(node.expr, args, params);
      return;
    }

    collectArguments(node.a, args, params);
    collectArguments(node.b, args, params);
    collectArguments(node.left, args, params);
    collectArguments(node.right, args, params);
    collectArguments(node.expr, args, params);
    collectArguments(node.ifNode, args, params);
    collectArguments(node.elseNode, args, params);
    collectArguments(node.target, args, params);
    collectArguments(node.source, args, params);
    node.others && node.others.forEach(n => collectArguments(n, args, params));
    node.nodes && node.nodes.forEach(n => collectArguments(n, args, params));
    node.args && node.args.forEach(n => collectArguments(n, args, params));
    collectArguments(node.callback, args, params);
  }
}

module.exports = AnimatedExpression;
