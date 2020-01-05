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

const AnimatedExpression = require('./AnimatedExpression');
const AnimatedValue = require('./AnimatedValue');
const AnimatedNode = require('./AnimatedNode');
const AnimatedWithChildren = require('./AnimatedWithChildren');
import type {ExpressionNode} from './expressions';

class AnimatedProc extends AnimatedWithChildren {
  _expression: AnimatedExpression;
  _args: AnimatedNode[];
  _params: AnimatedParam[];

  constructor(
    expression: AnimatedExpression,
    args: Array<AnimatedNode>,
    params: Array<AnimatedParam>,
  ) {
    super();
    this._expression = expression;
    this._args = args;
    this._params = params;
  }

  __attach() {
    this._expression.__attach();
    this._args.forEach(a => a.__addChild(this));
  }

  __makeNative() {
    this._expression.__makeNative();
    super.__makeNative();
  }

  __detach() {
    this._expression.__detach();
    this._args.forEach(a => a.__removeChild(this));
    super.__detach();
  }

  __getValue(): number {
    this._args.forEach((a, index) =>
      this._params[index].setValue(a.__getValue()),
    );
    return this._expression.__getValue();
  }

  __getNativeConfig(): any {
    return {
      type: 'proc',
      args: this._args.map(a => a.__getNativeTag()),
      params: this._params.map(a => a.__getNativeTag()),
      expression: this._expression.__getNativeTag(),
    };
  }
}

class AnimatedParam extends AnimatedValue {
  constructor(value: number) {
    super(value);
  }

  setValue(value: number): void {
    // $FlowFixMe This is intentional - we don't want to update setValue here
    super._value = value;
  }
}

export function createAnimatedProc(
  cb: (...args: AnimatedNode[]) => ExpressionNode,
): (...args: AnimatedNode[]) => AnimatedProc {
  const params: AnimatedParam[] = [];
  for (let i = 0; i < cb.length; i++) {
    params.push(new AnimatedParam(0));
  }
  const expression = cb(...params);
  return (...args: AnimatedNode[]) =>
    new AnimatedProc(new AnimatedExpression(expression), args, params);
}
