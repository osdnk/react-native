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
import {createEvaluator, converters, factories} from './expressions';

type CallCallbackListener = (args: number[]) => void;

class AnimatedExpression extends AnimatedWithChildren {
  _expression:
    | ExpressionNode
    | FormatExpressionNode
    | CastBooleanExpressionNode;

  _args: Array<any>;
  _parents: Array<any>;
  _evaluator: (() => number) | null;
  _callListeners: {[key: string]: CallCallbackListener, ...};
  _nativeCallCallbackListener: ?any;

  constructor(
    expression:
      | ExpressionNode
      | FormatExpressionNode
      | CastBooleanExpressionNode,
  ) {
    super();
    this._expression = expression instanceof Array ? 
      factories.block(expression) : expression;
    this._args = [];
    this._callListeners = {};
    this._parents = [];
  }

  __attach() {
    collectArguments(-1, this._expression, this._args);
    // Collect arguments and add this node as a child to each argument
    const _parents = this._parents;
    this._args.forEach(a => {
      if (a.func) {
        this.__addListener(a.id, a.func);
      } else {
        if (!_parents.find(p => p === a.node.node)) {
          _parents.push(a.node.node);
          a.node.node.__addChild(this);
        }
      }
    });
  }

  __detach() {
    this._args.forEach(a => {
      if (a.node) {
        if (this._parents.find(p => p === a.node.node)) {
          this._parents = this._parents.filter(p => p !== a.node.node);
          a.node.node.__removeChild(this);
        }
      }
    });
    this._evaluator = null;
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
      expression: converters[this._expression.type](this._expression),
    };
  }

  __makeNative() {
    this._args.forEach(a => a.node && a.node.node.__makeNative());
    super.__makeNative();
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
    this._callListeners = {};
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
) {
  if (node) {
    if (typeof node === 'function') {
      args.push({id: parentId, func: node});
      return;
    } else if (node.type === 'value') {
      if(node.node.__isProxy) {
        // Push proxy node
        args.push({id: parentId, node: {
          ...node,
          node: node.node.__val,
        }});  
      } else {
        args.push({id: parentId, node});
      }
    }

    const id = node.nodeId;
    collectArguments(id, node.a ? node.a : null, args);
    collectArguments(id, node.b ? node.b : null, args);
    collectArguments(id, node.left ? node.left : null, args);
    collectArguments(id, node.right ? node.right : null, args);
    collectArguments(id, node.expr ? node.expr : null, args);
    collectArguments(id, node.ifNode ? node.ifNode : null, args);
    collectArguments(id, node.elseNode ? node.elseNode : null, args);
    collectArguments(id, node.target ? node.target : null, args);
    collectArguments(id, node.source ? node.source : null, args);
    collectArguments(id, node.v ? node.v : null, args);
    collectArguments(id, node.callback ? node.callback : null, args);
    node.args && node.args.forEach(a => collectArguments(id, a, args));
  }
}

module.exports = AnimatedExpression;
