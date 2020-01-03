/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const AnimatedNode = require('../AnimatedNode');
const AnimatedValue = require('../AnimatedValue');
import Animation from '../../animations/Animation';
import TimingAnimation from '../../animations/TimingAnimation';

import type {ExpressionNode} from './types';

type ReducerFunction = () => number;

let _animationId = 0;
const _runningAnimations: {[number]: Animation, ...} = {};

const add = (node: ExpressionNode) => multi(node, (p, c) => p + c);
const sub = (node: ExpressionNode) => multi(node, (p, c) => p - c);
const multiply = (node: ExpressionNode) => multi(node, (p, c) => p * c);
const divide = (node: ExpressionNode) => multi(node, (p, c) => p / c);
const pow = (node: ExpressionNode) => multi(node, (p, c) => Math.pow(p, c));
const modulo = (node: ExpressionNode) =>
  multi(node, (p, c) => ((p % c) + c) % c);
const max = (node: ExpressionNode) => multi(node, (p, c) => (c > p ? c : p));
const min = (node: ExpressionNode) => multi(node, (p, c) => (c < p ? c : p));
const abs = (node: ExpressionNode) => unary(node, v => Math.abs(v));
const sqrt = (node: ExpressionNode) => unary(node, v => Math.sqrt(v));
const log = (node: ExpressionNode) => unary(node, v => Math.log(v));
const sin = (node: ExpressionNode) => unary(node, v => Math.sin(v));
const cos = (node: ExpressionNode) => unary(node, v => Math.cos(v));
const tan = (node: ExpressionNode) => unary(node, v => Math.tan(v));
const acos = (node: ExpressionNode) => unary(node, v => Math.acos(v));
const asin = (node: ExpressionNode) => unary(node, v => Math.asin(v));
const atan = (node: ExpressionNode) => unary(node, v => Math.atan(v));
const exp = (node: ExpressionNode) => unary(node, v => Math.exp(v));
const round = (node: ExpressionNode) => unary(node, v => Math.round(v));
const ceil = (node: ExpressionNode) => unary(node, v => Math.ceil(v));
const floor = (node: ExpressionNode) => unary(node, v => Math.floor(v));
const and = (node: ExpressionNode) => multi(node, (p, c) => (p && c ? 1 : 0));
const or = (node: ExpressionNode) => multi(node, (p, c) => (p || c ? 1 : 0));
const not = (node: ExpressionNode) => unary(node, v => (!v ? 1 : 0));
const eq = (node: ExpressionNode) =>
  boolean(node, (left, right) => (left === right ? 1 : 0));
const neq = (node: ExpressionNode) =>
  boolean(node, (left, right) => (left !== right ? 1 : 0));
const lessThan = (node: ExpressionNode) =>
  boolean(node, (left, right) => (left < right ? 1 : 0));
const greaterThan = (node: ExpressionNode) =>
  boolean(node, (left, right) => (left > right ? 1 : 0));
const lessOrEq = (node: ExpressionNode) =>
  boolean(node, (left, right) => (left <= right ? 1 : 0));
const greaterOrEq = (node: ExpressionNode) =>
  boolean(node, (left, right) => (left >= right ? 1 : 0));
const value = (node: ExpressionNode) => () => node.getValue && node.getValue();
const number = (node: ExpressionNode) => () => node.value;
const cond = condReducer;
const set = setReducer;
const block = blockReducer;
const call = callReducer;
const callProc = procReducer;
const timing = timingReducer;
const stopAnimation = stopAnimationReducer;

const evaluators = {
  add,
  sub,
  divide,
  multiply,
  pow,
  modulo,
  max,
  min,
  abs,
  sqrt,
  log,
  sin,
  cos,
  tan,
  acos,
  asin,
  atan,
  exp,
  round,
  ceil,
  floor,
  and,
  or,
  not,
  eq,
  neq,
  lessThan,
  greaterThan,
  lessOrEq,
  greaterOrEq,
  cond,
  set,
  block,
  call,
  value,
  number,
  callProc,
  timing,
  stopAnimation,
};

function createEvaluator(
  element: AnimatedNode | AnimatedValue | number | ExpressionNode,
): ReducerFunction {
  if (typeof element === 'number') {
    return () => element;
  } else if (element.hasOwnProperty('__attach')) {
    return () =>
      ((element: any): AnimatedNode).__getValue &&
      ((element: any): AnimatedNode).__getValue();
  }
  if (!element.type) {
    throw new Error('Error: Element type unknown.');
  }

  const node = ((element: any): ExpressionNode);
  if (!evaluators[node.type]) {
    throw new Error('Error: Node type ' + node.type + ' not found.');
  }
  return evaluators[node.type](element);
}

function stopAnimationReducer(node: ExpressionNode): ReducerFunction {
  const evaluator = createEvaluator(node);
  return () => {
    const animationId = evaluator();
    if (_runningAnimations[animationId]) {
      _runningAnimations[animationId].stop();
      delete _runningAnimations[animationId];
      return 1;
    }
    return 0;
  };
}

function timingReducer(node: ExpressionNode): ReducerFunction {
  if (!node.target) {
    throw Error('Target is not set in timing');
  }
  const target = node.target;
  if (!node.toValue) {
    throw Error('toValue is not set in timing');
  }
  const toValue = createEvaluator(node.toValue);
  if (!node.duration) {
    throw Error('Duration is not set in timing');
  }
  const duration = createEvaluator(node.duration);
  return () => {
    if (target.node) {
      const animation = new TimingAnimation({
        toValue: toValue(),
        duration: duration(),
        useNativeDriver: false,
      });
      const animationId = _animationId++;
      _runningAnimations[animationId] = animation;
      ((target.node: any): AnimatedValue).animate(
        new TimingAnimation({
          toValue: toValue(),
          duration: duration(),
          useNativeDriver: false,
        }),
        () => {
          delete _runningAnimations[animationId];
          if (node.source) {
            createEvaluator(node.source)();
          }
        },
      );
      return animationId;
    }
    return 0;
  };
}

function procReducer(node: ExpressionNode): ReducerFunction {
  if (!node.args) {
    throw Error('Args is not set in proc');
  }
  const args = node.args.map(createEvaluator);
  if (!node.params) {
    throw Error('Arguments is not set in proc');
  }
  const params = node.params;
  if (!node.evaluator) {
    throw Error('Function body is not set in proc');
  }
  const expr = createEvaluator(node.evaluator(...params));
  return () => {
    for (let i = 0; i < args.length; i++) {
      // $FlowFixMe
      params[i].setValue(args[i]());
    }
    return expr();
  };
}

function callReducer(node: ExpressionNode): ReducerFunction {
  const evalFuncs = (node.args ? node.args : []).map(createEvaluator);
  const callback = node.callback ? node.callback : (args: number[]) => {};
  return () => {
    let values = [];
    for (let i = 0; i < evalFuncs.length; i++) {
      values.push(evalFuncs[i]());
    }
    callback(values);
    return 0;
  };
}

function blockReducer(node: ExpressionNode): ReducerFunction {
  const evalFuncs = (node.nodes ? node.nodes : []).map(createEvaluator);
  return () => {
    let retVal = 0;
    for (let i = 0; i < evalFuncs.length; i++) {
      retVal = evalFuncs[i]();
    }
    return retVal;
  };
}

function setReducer(node: ExpressionNode): ReducerFunction {
  if (!node.source) {
    throw Error('Source missing in node');
  }
  const source = createEvaluator(node.source);
  if (!node.target || !node.target.setValue) {
    throw Error('Target not a valid animated value.');
  }
  return () => {
    const retVal = source();
    node.target && node.target.setValue && node.target.setValue(retVal);
    return retVal;
  };
}

function condReducer(node: ExpressionNode): ReducerFunction {
  if (!node.expr) {
    throw Error('Expression clause missing in node');
  }
  const expr = createEvaluator(node.expr);

  if (!node.ifNode) {
    throw Error('If clause missing in node');
  }
  const ifEval = createEvaluator(node.ifNode);

  const falseEval = node.elseNode ? createEvaluator(node.elseNode) : () => 0;

  return () => {
    const c = expr();
    if (c) {
      return ifEval();
    } else {
      return falseEval();
    }
  };
}

function multi(
  node: ExpressionNode,
  reducer: (prev: number, cur: number) => number,
): ReducerFunction {
  if (!node.a) {
    throw Error('A missing in node');
  }
  const a = createEvaluator(node.a);

  if (!node.b) {
    throw Error('B missing in node');
  }
  const b = createEvaluator(node.b);
  const others = (node.others || []).map(createEvaluator);
  return () => {
    let acc = reducer(a(), b());
    for (let i = 0; i < others.length; i++) {
      acc = reducer(acc, others[i]());
    }
    return acc;
  };
}

function unary(
  node: ExpressionNode,
  reducer: (v: number) => number,
): ReducerFunction {
  if (!node.v) {
    throw Error('Value clause missing in node');
  }
  const v = createEvaluator(node.v);
  return () => {
    return reducer(v());
  };
}

function boolean(
  node: ExpressionNode,
  reducer: (left: number, right: number) => number,
): ReducerFunction {
  if (!node.left) {
    throw Error('Left missing in node');
  }
  const left = createEvaluator(node.left);

  if (!node.right) {
    throw Error('Right missing in node');
  }
  const right = createEvaluator(node.right);
  return () => {
    return reducer(left(), right());
  };
}

export {createEvaluator};
