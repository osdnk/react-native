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

jest.mock('../../../BatchedBridge/NativeModules', () => ({
  NativeAnimatedModule: {},
  PlatformConstants: {
    getConstants() {
      return {};
    },
  },
}));

let Animated = require('../Animated');
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

  it('should evaluate proc expressions', () => {
    const proc = E.proc((a, b) => E.add(a, b));
    expect(evalExpression(proc(10, 20))).toBe(30);
  });

  it('should evaluate proc expressions with animated values as input', () => {
    const proc = E.proc((a, b) => E.add(a, b));
    const p1 = new Animated.Value(10);
    const p2 = new Animated.Value(20);
    expect(evalExpression(proc(p1, p2))).toBe(30);
  });
});
