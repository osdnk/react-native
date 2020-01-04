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
import type {
  ExpressionNode,
  FormatExpressionNode,
  CastBooleanExpressionNode,
} from './expressions';
import {createEvaluator, converters} from './expressions';

type CallCallbackListener = (args: number[]) => void;

class AnimatedExpression extends AnimatedWithChildren {
  _expression:
    | ExpressionNode
    | FormatExpressionNode
    | CastBooleanExpressionNode;

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
    collectArguments(-1, this._expression, this._args, this._params);
    // Collect arguments and add this node as a child to each argument
    this._args.forEach(a => {
      if (typeof a.node === 'function') {
        this.__addListener(a.id, a.node);
      } else {
        a.node.node.__addChild(this);
      }
    });
    this._params.forEach(p => p.node.node.__attach());
  }

  __detach() {
    this._args.forEach(
      a => typeof a !== 'function' && a.node.node.__removeChild(this),
    );
    this._params.forEach(p => p.node.node.__detach());
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
    this._params.forEach(p => p.node.node.__makeNative());
    this.__startListeningToCallCallbacks();
  }

  __addListener(nodeId: number, callback: (args: number[]) => void): string {
    this._callListeners[nodeId.toString()] = callback;
    if (this.__isNative) {
      this.__startListeningToCallCallbacks();
    }
    return nodeId.toString();
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
              if (key === data.nodeId.toString()) {
                this._callListeners[key](data.values);
              }
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
  parentId: number,
  node: ?(ExpressionNode | Function),
  args: Array<any>,
  params: Array<any>,
) {
  if (node) {
    if (typeof node === 'function') {
      args.push({id: parentId, node});
    } else if (node.type === 'value') {
      args.push({id: parentId, node});
    } else if (node.type === 'callProc') {
      node.params &&
        node.params.forEach(p => params.push({id: parentId, node: p}));
      node.args && node.args.forEach(p => params.push({id: parentId, node: p}));
    }

    const id = node.nodeId;

    collectArguments(id, node.a ? node.a : null, args, params);
    collectArguments(id, node.b ? node.b : null, args, params);
    collectArguments(id, node.left ? node.left : null, args, params);
    collectArguments(id, node.right ? node.right : null, args, params);
    collectArguments(id, node.expr ? node.expr : null, args, params);
    collectArguments(id, node.ifNode ? node.ifNode : null, args, params);
    collectArguments(id, node.elseNode ? node.elseNode : null, args, params);
    collectArguments(id, node.target ? node.target : null, args, params);
    collectArguments(id, node.source ? node.source : null, args, params);
    collectArguments(id, node.v ? node.v : null, args, params);
    node.others &&
      node.others.forEach(n => collectArguments(id, n, args, params));
    node.nodes &&
      node.nodes.forEach(n => collectArguments(id, n, args, params));
    node.args && node.args.forEach(n => collectArguments(id, n, args, params));
    collectArguments(id, node.callback ? node.callback : null, args, params);
  }
}

module.exports = AnimatedExpression;
