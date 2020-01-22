/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const bezierFunction = require('../../bezier');
const sprintf = require('sprintf-js').sprintf;
const AnimatedNode = require('../AnimatedNode');
const AnimatedValue = require('../AnimatedValue');

import Animation from '../../animations/Animation';
import TimingAnimation from '../../animations/TimingAnimation';
import SpringAnimation from '../../animations/SpringAnimation';
import DecayAnimation from '../../animations/DecayAnimation';
import ClockAnimation from '../../animations/ClockAnimation';

import type {DecayAnimationConfigSingle} from '../../animations/DecayAnimation';

import type {
  ExpressionNode,
  ExpressionParam,
  MultiExpressionNode,
  UnaryExpressionNode,
  BooleanExpressionNode,
  NumberExpressionNode,
  AnimatedValueExpressionNode,
  SetStatementNode,
  BlockStatementNode,
  CondStatementNode,
  CallStatementNode,
  FormatExpressionNode,
  CastBooleanExpressionNode,
  StartTimingStatementNode,
  StartSpringStatementNode,
  StartDecayStatementNode,
  StartClockStatementNode,
  StopClockStatementNode,
  StopAnimationStatementNode,
  ClockRunningExpressionNode,
  BezierExpressionNode,
} from './types';

type ReducerFunction = () => number;

const _animations: {[number]: Animation, ...} = {};
let _animationId = 0;

const add = (node: MultiExpressionNode) => multi(node, (p, c) => p + c);
const sub = (node: MultiExpressionNode) => multi(node, (p, c) => p - c);
const multiply = (node: MultiExpressionNode) => multi(node, (p, c) => p * c);
const divide = (node: MultiExpressionNode) => multi(node, (p, c) => p / c);
const pow = (node: MultiExpressionNode) =>
  multi(node, (p, c) => Math.pow(p, c));
const modulo = (node: MultiExpressionNode) =>
  multi(node, (p, c) => ((p % c) + c) % c);
const max = (node: MultiExpressionNode) =>
  multi(node, (p, c) => (c > p ? c : p));
const min = (node: MultiExpressionNode) =>
  multi(node, (p, c) => (c < p ? c : p));
const abs = (node: UnaryExpressionNode) => unary(node, v => Math.abs(v));
const sqrt = (node: UnaryExpressionNode) => unary(node, v => Math.sqrt(v));
const log = (node: UnaryExpressionNode) => unary(node, v => Math.log(v));
const sin = (node: UnaryExpressionNode) => unary(node, v => Math.sin(v));
const cos = (node: UnaryExpressionNode) => unary(node, v => Math.cos(v));
const tan = (node: UnaryExpressionNode) => unary(node, v => Math.tan(v));
const acos = (node: UnaryExpressionNode) => unary(node, v => Math.acos(v));
const asin = (node: UnaryExpressionNode) => unary(node, v => Math.asin(v));
const atan = (node: UnaryExpressionNode) => unary(node, v => Math.atan(v));
const exp = (node: UnaryExpressionNode) => unary(node, v => Math.exp(v));
const round = (node: UnaryExpressionNode) => unary(node, v => Math.round(v));
const ceil = (node: UnaryExpressionNode) => unary(node, v => Math.ceil(v));
const floor = (node: UnaryExpressionNode) => unary(node, v => Math.floor(v));
const and = (node: MultiExpressionNode) =>
  multi(node, (p, c) => (p && c ? 1 : 0));
const or = (node: MultiExpressionNode) =>
  multi(node, (p, c) => (p || c ? 1 : 0));
const not = (node: UnaryExpressionNode) => unary(node, v => (!v ? 1 : 0));
const eq = (node: BooleanExpressionNode) =>
  boolean(node, (left, right) => (left === right ? 1 : 0));
const neq = (node: BooleanExpressionNode) =>
  boolean(node, (left, right) => (left !== right ? 1 : 0));
const lessThan = (node: BooleanExpressionNode) =>
  boolean(node, (left, right) => (left < right ? 1 : 0));
const greaterThan = (node: BooleanExpressionNode) =>
  boolean(node, (left, right) => (left > right ? 1 : 0));
const lessOrEq = (node: BooleanExpressionNode) =>
  boolean(node, (left, right) => (left <= right ? 1 : 0));
const greaterOrEq = (node: BooleanExpressionNode) =>
  boolean(node, (left, right) => (left >= right ? 1 : 0));
const value = (node: AnimatedValueExpressionNode) => () =>
  node.getValue && node.getValue();
const number = (node: NumberExpressionNode) => () => node.value;
const cond = condReducer;
const set = setReducer;
const block = blockReducer;
const call = callReducer;
const startTiming = timingReducer;
const startSpring = springReducer;
const startDecay = decayReducer;
const stopAnimation = stopAnimationReducer;
const diff = diffReducer;
const startClock = startClockReducer;
const stopClock = stopClockReducer;
const clockRunning = clockRunningReducer;
const animationRunning = clockRunningReducer;
const bezier = bezierReducer;

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
  startTiming,
  startSpring,
  startDecay,
  stopAnimation,
  startClock,
  stopClock,
  clockRunning,
  animationRunning,
  diff,
  bezier,
};

let EXPRESSION_LOG: string = '';
const getExpressionLog = (): string => EXPRESSION_LOG;
const clearExpressionLog = (): string => (EXPRESSION_LOG = '');
export {getExpressionLog, clearExpressionLog};

const PRINT_EXPRESSIONS = false;
let PRINT_INDENTATION = 0;
const printExp = (type: string, ...args: any) => {
  EXPRESSION_LOG += new Array(PRINT_INDENTATION).join('    ');
  EXPRESSION_LOG += type + ': ';
  EXPRESSION_LOG += args.map(a => a).join(' ');
  EXPRESSION_LOG += '\n';
};
const indent = () => {
  EXPRESSION_LOG += new Array(PRINT_INDENTATION).join('    ') + '{\n';
  PRINT_INDENTATION++;
};
const outdent = () => {
  PRINT_INDENTATION--;
  EXPRESSION_LOG += new Array(PRINT_INDENTATION).join('    ') + '}\n';
};

function createEvaluator(
  element: ExpressionParam | FormatExpressionNode | CastBooleanExpressionNode,
): () => any {
  if (typeof element === 'object' && element.type) {
    if (element.type === 'format') {
      return formatReducer(((element: any): FormatExpressionNode));
    } else if (element.type === 'castBoolean') {
      const reducer = castBooleanReducer(
        ((element: any): CastBooleanExpressionNode),
      );
      return () => (reducer() === 0 ? false : true);
    }
  }
  return createEvaluatorInternal(((element: any): ExpressionParam));
}

function createEvaluatorInternal(element: ExpressionParam): ReducerFunction {
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
  const reducer = evaluators[node.type](element);
  Object.defineProperty(reducer, 'name', {value: node.type});
  return reducer;
}

function bezierReducer(node: BezierExpressionNode): ReducerFunction {
  if (!node.v) {
    throw Error('Value is missing in bezier');
  }
  const evaluator = createEvaluatorInternal(node.v);
  const bezierEval = bezierFunction(node.mX1, node.mY1, node.mX2, node.mY2);
  return () => bezierEval(evaluator());
}

function startClockReducer(node: StartClockStatementNode): ReducerFunction {
  const animationValue = ((node.target.node: any): AnimatedValue);
  const singleConfig: any = node.config;
  const callback = node.callback
    ? createEvaluatorInternal(node.callback)
    : null;
  return () => {
    if (PRINT_EXPRESSIONS) {
      printExp(
        'startClock',
        'starting clock animation for node with value',
        animationValue.__getValue(),
      );
    }
    const animation = new ClockAnimation({
      ...singleConfig,
      useNativeDriver: false,
    });
    let localCallback = callback;
    animationValue.animate(animation, ({finished}) => {
      if (localCallback) {
        const tmp = localCallback;
        localCallback = null;
        tmp();
      }
    });
    return 1;
  };
}

function stopClockReducer(node: StopClockStatementNode): ReducerFunction {
  const animationValue = ((node.target.node: any): AnimatedValue);
  return () => {
    // $FlowFixMe - we need to check the animation for the node
    if (animationValue._animation) {
      if (PRINT_EXPRESSIONS) {
        printExp(
          'stopClock',
          'stopping clock animation for node with value',
          animationValue.__getValue(),
        );
      }
      animationValue._animation.stop();
      return 1;
    }
    if (PRINT_EXPRESSIONS) {
      printExp(
        'stopClock',
        'stopping clock that was not running for node with value',
        animationValue.__getValue(),
      );
    }
    return 0;
  };
}

function clockRunningReducer(
  node: ClockRunningExpressionNode,
): ReducerFunction {
  const animationValue = ((node.target.node: any): AnimatedValue);
  return () => {
    // $FlowFixMe - we need to check the animation for the node
    const retVal = animationValue._animation ? 1 : 0;
    if (PRINT_EXPRESSIONS) {
      printExp('clockRunning', 'checking clock running returned', retVal);
    }
    // $FlowFixMe - we need to check the animation for the node
    return retVal;
  };
}

function diffReducer(node: UnaryExpressionNode): ReducerFunction {
  let prevValue = Number.MIN_SAFE_INTEGER;
  return unary(node, v => {
    if (prevValue === Number.MIN_SAFE_INTEGER) {
      prevValue = v;
      return 0;
    }
    const stash = prevValue;
    prevValue = v;
    if (PRINT_EXPRESSIONS) {
      printExp('diff', 'diff between', prevValue, v, 'returned', v - stash);
    }
    return v - stash;
  });
}

function timingReducer(node: StartTimingStatementNode): ReducerFunction {
  const animationValue = ((node.target.node: any): AnimatedValue);
  const singleConfig: any = node.config;
  const callback = node.callback
    ? createEvaluatorInternal(node.callback)
    : null;
  return () => {
    const animationId = _animationId++;
    let localCallback = callback;
    _animations[animationId] = new TimingAnimation({
      ...singleConfig,
      useNativeDriver: false,
    });
    if (PRINT_EXPRESSIONS) {
      printExp(
        'startTiming',
        'starting timing for node with value',
        animationValue.__getValue(),
        'with id',
        animationId,
      );
    }
    animationValue.animate(_animations[animationId], ({finished}) => {
      delete _animations[animationId];
      if (localCallback) {
        const tmp = localCallback;
        localCallback = null;
        if (PRINT_EXPRESSIONS) {
          printExp(
            'startTiming',
            'timing animation with id',
            animationId,
            'stopped.',
            animationId,
          );
        }
        tmp();
      }
    });
    return animationId;
  };
}

function springReducer(node: StartSpringStatementNode): ReducerFunction {
  const animationValue = ((node.target.node: any): AnimatedValue);
  const singleConfig: any = node.config;
  const velocityEvaluator = createEvaluatorInternal(node.config.velocity);
  const callback = node.callback
    ? createEvaluatorInternal(node.callback)
    : null;
  return () => {
    const animationId = _animationId++;
    let localCallback = callback;
    _animations[animationId] = new SpringAnimation({
      ...singleConfig,
      velocity: velocityEvaluator(),
      useNativeDriver: false,
    });
    if (PRINT_EXPRESSIONS) {
      printExp(
        'startSpring',
        'starting spring for node with value',
        animationValue.__getValue(),
        'with id',
        animationId,
      );
    }
    animationValue.animate(_animations[animationId], ({finished}) => {
      delete _animations[animationId];
      if (localCallback) {
        const tmp = localCallback;
        localCallback = null;
        if (PRINT_EXPRESSIONS) {
          printExp(
            'startSpring',
            'spring animation with id',
            animationId,
            'stopped.',
            animationId,
          );
        }
        tmp();
      }
    });
    return animationId;
  };
}

function decayReducer(node: StartDecayStatementNode): ReducerFunction {
  const animationValue = ((node.target.node: any): AnimatedValue);
  const callback = node.callback
    ? createEvaluatorInternal(node.callback)
    : null;
  const velocityEvaluator = createEvaluatorInternal(node.config.velocity);
  return () => {
    const config: DecayAnimationConfigSingle = {
      velocity: velocityEvaluator(),
      deceleration:
        node.config.deceleration !== undefined
          ? node.config.deceleration
          : 0.998,
      useNativeDriver: false,
    };

    const animationId = _animationId++;
    if (PRINT_EXPRESSIONS) {
      printExp(
        'startDecay',
        'starting decay for node with value',
        animationValue.__getValue(),
        'with id',
        animationId,
      );
    }

    _animations[animationId] = new DecayAnimation(config);
    let localCallback = callback;
    animationValue.animate(_animations[animationId], ({finished}) => {
      delete _animations[animationId];
      if (localCallback) {
        const tmp = localCallback;
        localCallback = null;
        if (PRINT_EXPRESSIONS) {
          printExp(
            'startDecay',
            'decay animation with id',
            animationId,
            'stopped.',
            animationId,
          );
        }
        tmp();
      }
    });
    return animationId;
  };
}

function stopAnimationReducer(
  node: StopAnimationStatementNode,
): ReducerFunction {
  const evalAnimationId = createEvaluatorInternal(node.animationId);
  return () => {
    const animationId = evalAnimationId();
    if (_animations[animationId]) {
      if (PRINT_EXPRESSIONS) {
        printExp('stopAnimation', 'stopping animation with id', animationId);
      }
      _animations[animationId].stop();
      delete _animations[animationId];
      return 1;
    }
    if (PRINT_EXPRESSIONS) {
      printExp(
        'stopAnimation',
        'animation with id',
        animationId,
        'was not running.',
      );
    }
    return 0;
  };
}

function formatReducer(node: FormatExpressionNode): ReducerFunction {
  if (!node.format) {
    throw Error('Format string is missing in format');
  }
  if (!node.args) {
    throw Error('Arguments is missing in format');
  }
  const args = node.args.map(createEvaluatorInternal);
  return () => {
    const results = [];
    for (let i = 0; i < args.length; i++) {
      results.push(args[i]());
    }
    if (PRINT_EXPRESSIONS) {
      const retVal = sprintf(node.format, ...results);
      printExp('format', 'format string', retVal);
      return retVal;
    }
    return sprintf(node.format, ...results);
  };
}

function castBooleanReducer(node: CastBooleanExpressionNode): ReducerFunction {
  if (!node.v) {
    throw Error('Value is missing in boolean');
  }
  const evaluator = createEvaluatorInternal(node.v);
  if (PRINT_EXPRESSIONS) {
    return () => {
      const retVal = evaluator();
      printExp('boolean', 'casting to boolean', retVal);
      return retVal;
    };
  }
  return () => evaluator();
}

function callReducer(node: CallStatementNode): ReducerFunction {
  const evalFuncs = (node.args ? node.args : []).map(createEvaluatorInternal);
  const callback = node.callback ? node.callback : (args: number[]) => {};
  return () => {
    let values = [];
    for (let i = 0; i < evalFuncs.length; i++) {
      values.push(evalFuncs[i]());
    }
    if (PRINT_EXPRESSIONS) {
      printExp('call', 'calling js function with values', ...values);
    }
    callback(values);
    return 0;
  };
}

function blockReducer(node: BlockStatementNode): ReducerFunction {
  const evalFuncs = node.args.map(createEvaluatorInternal);
  return () => {
    if (PRINT_EXPRESSIONS) {
      printExp('block', 'executing block with', evalFuncs.length, 'elements');
      indent();
    }
    let retVal = 0;
    for (let i = 0; i < evalFuncs.length; i++) {
      retVal = evalFuncs[i]();
    }
    if (PRINT_EXPRESSIONS) {
      outdent();
      printExp('block', 'block returned', retVal);
    }
    return retVal;
  };
}

function setReducer(node: SetStatementNode): ReducerFunction {
  if (!node.source) {
    throw Error('Source missing in node');
  }
  const source = createEvaluatorInternal(node.source);
  if (!node.target || !node.target.setValue) {
    throw Error('Target not a valid animated value.');
  }
  return () => {
    const retVal = source();
    node.target && node.target.setValue && node.target.setValue(retVal);
    if (PRINT_EXPRESSIONS) {
      printExp(
        'set',
        'setting node with previous value',
        node.target.getValue(),
        'to',
        retVal,
      );
    }
    return retVal;
  };
}

function condReducer(node: CondStatementNode): ReducerFunction {
  if (!node.expr) {
    throw Error('Expression clause missing in node');
  }
  const expr = createEvaluatorInternal(node.expr);

  if (!node.ifNode) {
    throw Error('If clause missing in node');
  }
  const ifEval = createEvaluatorInternal(node.ifNode);
  const elseEval = node.elseNode
    ? createEvaluatorInternal(node.elseNode)
    : () => 0;

  return () => {
    if (PRINT_EXPRESSIONS) {
      printExp('evaluating condition');
      indent();
      let c = expr();
      printExp('condition evaluated to', c);
      indent();
      let retVal = c ? ifEval() : elseEval();
      outdent();
      outdent();
      printExp('condition returned', retVal);
      return retVal;
    } else {
      return expr() ? ifEval() : elseEval();
    }
  };
}

function multi(
  node: MultiExpressionNode,
  reducer: (prev: number, cur: number) => number,
): ReducerFunction {
  const a = createEvaluatorInternal(node.a);
  const b = createEvaluatorInternal(node.b);
  const args = node.args.map(createEvaluatorInternal);
  return () => {
    const aEval = a();
    const bEval = b();
    const argsEvaluated = args.map(n => n());
    let acc = reducer(aEval, bEval);
    for (let i = 0; i < args.length; i++) {
      acc = reducer(acc, argsEvaluated[i]);
    }
    if (PRINT_EXPRESSIONS) {
      printExp(node.type, 'reducing', aEval, bEval, ...argsEvaluated, '=', acc);
    }
    return acc;
  };
}

function unary(
  node: UnaryExpressionNode,
  reducer: (v: number) => number,
): ReducerFunction {
  if (!node.v) {
    throw Error('Value clause missing in node');
  }
  const v = createEvaluatorInternal(node.v);
  return () => {
    if (PRINT_EXPRESSIONS) {
      const arg = v();
      const retVal = reducer(arg);
      printExp(node.type, 'reducing', arg, 'to', retVal);
      return retVal;
    }
    return reducer(v());
  };
}

function boolean(
  node: BooleanExpressionNode,
  reducer: (left: number, right: number) => number,
): ReducerFunction {
  if (!node.left) {
    throw Error('Left missing in node');
  }
  const left = createEvaluatorInternal(node.left);

  if (!node.right) {
    throw Error('Right missing in node');
  }
  const right = createEvaluatorInternal(node.right);
  return () => {
    if (PRINT_EXPRESSIONS) {
      const argLeft = left();
      const argRight = right();
      const retVal = reducer(argLeft, argRight);
      printExp(node.type, 'reducing', argLeft, argRight, 'to', retVal);
      return retVal;
    }
    return reducer(left(), right());
  };
}

export {createEvaluator};
