/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';
import {
  clearExpressionLog,
  getExpressionLog,
} from '../nodes/expressions/evaluators';

jest.mock('../../../BatchedBridge/NativeModules', () => ({
  NativeAnimatedModule: {},
  PlatformConstants: {
    getConstants() {
      return {};
    },
  },
}));

let Animated = require('../Animated');
let Easing = require('../Easing');
let {E} = Animated;

function evalExpression(expr) {
  return Animated.expression(expr).__getValue();
}

describe('Animated Expressions', () => {
  it('should handle numbers as expressions', () => {
    expect(evalExpression(100)).toBe(100);
  });

  it('should support nested expressions', () => {
    expect(evalExpression(E.add(10, E.multiply(10, 10)))).toBe(110);
  });

  it('should return the last value from a block with array spread', () => {
    expect(evalExpression(E.block(10, 100))).toBe(100);
  });

  it('should return the last value from a block with array param', () => {
    expect(evalExpression(E.block([10, 100]))).toBe(100);
  });

  it('should return the true expression from a condition when expr is true', () => {
    expect(evalExpression(E.cond(1, 100, 0))).toBe(100);
  });

  it('should return the false expression from a condition when expr is false', () => {
    expect(evalExpression(E.cond(0, 100, 0))).toBe(0);
  });

  it('should support setting a vvalue on another node', () => {
    const node = new Animated.Value(0);
    evalExpression(E.set(node, 100));
    expect(node.__getValue()).toBe(100);
  });

  it('should add multiple numbers', () => {
    expect(evalExpression(E.add(10, 10, 10))).toBe(30);
  });

  it('should subtracting multiple numbers', () => {
    expect(evalExpression(E.sub(100, 10, 10))).toBe(80);
  });

  it('should multiply multiple numbers', () => {
    expect(evalExpression(E.multiply(10, 10, 10))).toBe(1000);
  });

  it('should divide multiple numbers', () => {
    expect(evalExpression(E.divide(100, 2, 2, 5))).toBe(5);
  });

  it('should calc the power of multiple numbers', () => {
    expect(evalExpression(E.pow(2, 2, 2))).toBe(16);
  });

  it('should calc the modulo of multiple numbers', () => {
    expect(evalExpression(E.modulo(20, 8, 3))).toBe(1);
  });

  it('abs', () => expect(evalExpression(E.abs(-16))).toBe(16));
  it('sqrt', () => expect(evalExpression(E.sqrt(16))).toBe(4));
  it('log', () => expect(evalExpression(E.log(16))).toBe(Math.log(16)));
  it('sin', () => expect(evalExpression(E.sin(16))).toBe(Math.sin(16)));
  it('cos', () => expect(evalExpression(E.cos(16))).toBe(Math.cos(16)));
  it('tan', () => expect(evalExpression(E.tan(16))).toBe(Math.tan(16)));
  it('asin', () => expect(evalExpression(E.asin(16))).toBe(Math.asin(16)));
  it('acos', () => expect(evalExpression(E.acos(16))).toBe(Math.acos(16)));
  it('atan', () => expect(evalExpression(E.atan(16))).toBe(Math.atan(16)));
  it('exp', () => expect(evalExpression(E.exp(16))).toBe(Math.exp(16)));
  it('round', () => expect(evalExpression(E.round(16.5))).toBe(17));

  it('should return true for and', () => {
    expect(evalExpression(E.and(20, 8, 3))).toBe(1);
  });

  it('should return false for and', () => {
    expect(evalExpression(E.and(0, 8, 3))).toBe(0);
  });

  it('should return true for or', () => {
    expect(evalExpression(E.or(0, 8, 3))).toBe(1);
  });

  it('should return false for or', () => {
    expect(evalExpression(E.or(0, 0, 0))).toBe(0);
  });

  it('should return true for not', () => {
    expect(evalExpression(E.not(0))).toBe(1);
  });

  it('should return false for not', () => {
    expect(evalExpression(E.not(1))).toBe(0);
  });

  it('should return true for two equal numbers for eq', () => {
    expect(evalExpression(E.eq(1, 1))).toBe(1);
  });

  it('should return false for two non-equal numbers for eq', () => {
    expect(evalExpression(E.eq(1, 200))).toBe(0);
  });

  it('should return false for two equal numbers for neq', () => {
    expect(evalExpression(E.neq(1, 1))).toBe(0);
  });

  it('should return true for two non-equal numbers for neq', () => {
    expect(evalExpression(E.neq(1, 200))).toBe(1);
  });

  it('should return true for greaterThan', () => {
    expect(evalExpression(E.greaterThan(100, 1))).toBe(1);
  });

  it('should return false for greaterThan', () => {
    expect(evalExpression(E.greaterThan(1, 100))).toBe(0);
  });

  it('should return true for lessThan', () => {
    expect(evalExpression(E.lessThan(10, 100))).toBe(1);
  });

  it('should return false for lessThan', () => {
    expect(evalExpression(E.lessThan(100, 10))).toBe(0);
  });

  it('should return true for greaterOrEq', () => {
    expect(evalExpression(E.greaterOrEq(100, 1))).toBe(1);
  });

  it('should return true for greaterOrEq for equal numbers', () => {
    expect(evalExpression(E.greaterOrEq(100, 100))).toBe(1);
  });

  it('should return false for greaterOrEq', () => {
    expect(evalExpression(E.greaterOrEq(1, 100))).toBe(0);
  });

  it('should return true for lessOrEq', () => {
    expect(evalExpression(E.lessOrEq(1, 100))).toBe(1);
  });

  it('should return true for lessOrEq for equal numbers', () => {
    expect(evalExpression(E.lessOrEq(100, 100))).toBe(1);
  });

  it('should return false for lessOrEq', () => {
    expect(evalExpression(E.lessOrEq(100, 1))).toBe(0);
  });

  it('should return max', () => {
    expect(evalExpression(E.max(20, 10, 4))).toBe(20);
  });

  it('should return min', () => {
    expect(evalExpression(E.min(20, 10, 30))).toBe(10);
  });

  it('should return ceil', () => {
    expect(evalExpression(E.ceil(10.1))).toBe(11);
  });

  it('should return floor', () => {
    expect(evalExpression(E.floor(10.9))).toBe(10);
  });

  it('should return 0 the first time diff is evaluated', () => {
    const value = new Animated.Value(0);
    const expression = Animated.expression(E.diff(value));
    expect(expression.__getValue()).toBe(0);
  });

  it('should return diff the second time diff is evaluated', () => {
    const value = new Animated.Value(0);
    const expression = Animated.expression(E.diff(value));
    expression.__getValue();
    value.setValue(10);
    expect(expression.__getValue()).toBe(10);
  });

  it('should accept reusing const nodes', () => {
    const adder = E.add(10, 10);
    const a1 = E.add(adder, 10);
    const a2 = E.add(adder, 20);
    expect(evalExpression(a1)).toBe(30);
    expect(evalExpression(a2)).toBe(40);
  });

  it('should return correct values from a timing animation', () => {
    const clock = new Animated.E.Clock();
    clock.setValue(1000); // Clock should have a positive value
    const state = {
      time: new Animated.Value(0),
      frameTime: new Animated.Value(0),
      position: new Animated.Value(0),
      finished: new Animated.Value(0),
    };
    const config = {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
    };
    const expr = Animated.expression(E.timing(clock, state, config));
    expr.__getValue();
    expect(state.position.__getValue()).toBe(0);
    expect(state.finished.__getValue()).toBe(0);
    clock.setValue(1250);
    expr.__getValue();
    expect(state.position.__getValue()).toBe(0.25);
    expect(state.finished.__getValue()).toBe(0);
    clock.setValue(1500);
    expr.__getValue();
    expect(state.position.__getValue()).toBe(0.5);
    expect(state.finished.__getValue()).toBe(0);
    clock.setValue(2000);
    expr.__getValue();
    expect(state.position.__getValue()).toBe(1);
    expect(state.finished.__getValue()).toBe(1);
  });

  it('should return correct values from a timing animation with easing', () => {
    const clock = new Animated.E.Clock();
    clock.setValue(1000); // Clock should have a positive value
    const state = {
      time: new Animated.Value(0),
      frameTime: new Animated.Value(0),
      position: new Animated.Value(0),
      finished: new Animated.Value(0),
    };
    const config = {
      toValue: 1,
      duration: 1000,
      easing: Easing.ease,
    };
    const expr = Animated.expression(E.timing(clock, state, config));
    expr.__getValue();
    expect(state.position.__getValue()).toBe(0);
    expect(state.finished.__getValue()).toBe(0);
    clock.setValue(1250);
    expr.__getValue();
    expect(state.position.__getValue()).toBe(0.25);
    expect(state.finished.__getValue()).toBe(0);
    clock.setValue(1500);
    expr.__getValue();
    expect(state.position.__getValue()).toBe(0.5);
    expect(state.finished.__getValue()).toBe(0);
    clock.setValue(2000);
    expr.__getValue();
    expect(state.position.__getValue()).toBe(1);
    expect(state.finished.__getValue()).toBe(1);
  });

  it('should  return correct values from a spring animation', () => {
    const clock = new Animated.E.Clock();
    clock.setValue(1000); // Clock should have a positive value
    const state = {
      time: new Animated.Value(0),
      velocity: new Animated.Value(0),
      position: new Animated.Value(0),
      finished: new Animated.Value(0),
    };
    const config = {
      toValue: 1,
      damping: 12,
      mass: 1,
      stiffness: 150,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    };
    const a = Animated.expression(E.spring(clock, state, config));
    a.__getValue();
    expect(state.position.__getValue()).toBe(0);
    expect(state.finished.__getValue()).toBe(0);
    clearExpressionLog();
    // clock.setValue(2000);
    // a.__getValue();
    // clock.setValue(3000);
    // a.__getValue();
    clock.setValue(4000);
    a.__getValue();
    const ex = getExpressionLog();
    expect(state.position.__getValue()).toBe(1);
    expect(state.finished.__getValue()).toBe(1);
  });

  it('should return correct values from a decay animation', () => {
    const clock = new Animated.Value(1000);
    const state = {
      time: new Animated.Value(10),
      velocity: new Animated.Value(-100),
      position: new Animated.Value(50),
      finished: new Animated.Value(0),
    };
    const config = {
      deceleration: 0.998,
    };
    const expr = Animated.expression(E.decay(clock, state, config));
    expr.__getValue();
    expect(state.position.__getValue()).toBeLessThan(19);
    expect(state.finished.__getValue()).toBe(0);
    clock.setValue(3000);
    expr.__getValue();
    expect(state.position.__getValue()).toBeLessThan(1);
    expect(state.finished.__getValue()).toBe(1);
  });
});
