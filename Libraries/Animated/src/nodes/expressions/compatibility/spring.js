/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type AnimatedValue from '../../AnimatedValue';
import Value from '../../AnimatedValue';
import type AnimatedNode from '../../AnimatedNode';
import type {AnimatedClock} from '../compatibility/Clock';
import type {ExpressionNode} from '../types';

import {factories} from '../factories';
const {
  block,
  cond,
  exp,
  sqrt,
  sin,
  cos,
  neq,
  or,
  and,
  add,
  set,
  greaterThan,
  lessThan,
  multiply,
  sub,
  abs,
  eq,
  min,
  divide,
} = factories;

const MAX_STEPS_MS = 64;

type SpringState = {
  time: AnimatedValue,
  velocity: AnimatedValue,
  position: AnimatedValue,
  prevPosition?: AnimatedValue,
  finished: AnimatedValue,
};

type SpringConfig = {
  toValue: AnimatedNode | number,
  damping: AnimatedNode | number,
  mass: AnimatedNode | number,
  stiffness: AnimatedNode | number,
  overshootClamping: AnimatedNode | number,
  restSpeedThreshold: AnimatedNode | number,
  restDisplacementThreshold: AnimatedNode | number,
};

function spring(
  clock: AnimatedClock,
  state: SpringState,
  config: SpringConfig,
): ExpressionNode {
  const w0 = sqrt(divide(config.stiffness, config.mass));
  const zeta = divide(
    config.damping,
    multiply(2, sqrt(multiply(config.stiffness, config.mass))),
  );
  const wd = cond(
    lessThan(zeta, 1),
    multiply(w0, sqrt(sub(1, multiply(zeta, zeta)))),
    0,
  );
  const a = 1;
  const b = cond(
    lessThan(zeta, 1),
    divide(add(multiply(zeta, w0), multiply(-1, state.velocity)), wd),
    add(multiply(-1, state.velocity), w0),
  );
  const lastTime = cond(state.time, state.time, clock);
  const deltaTime = min(sub(clock, lastTime), MAX_STEPS_MS);
  const t = divide(deltaTime, 1000); // in seconds

  return block(
    set(state.time, clock),
    set(
      state.position,
      sub(
        1,
        cond(
          lessThan(zeta, 1),
          multiply(
            exp(multiply(multiply(multiply(-1, t), zeta), w0)),
            add(
              multiply(a, cos(multiply(wd, t))),
              multiply(b, sin(multiply(wd, t))),
            ),
          ),
          multiply(add(a, multiply(b, t)), exp(multiply(multiply(-1, t), w0))),
        ),
      ),
    ),
  );
  // const lastTime = cond(state.time, state.time, clock);

  // const deltaTime = min(sub(clock, lastTime), MAX_STEPS_MS);

  // const c = config.damping;
  // const m = config.mass;
  // const k = config.stiffness;

  // const v0 = multiply(-1, state.velocity);
  // const x0 = sub(config.toValue, state.position);

  // const zeta = divide(c, multiply(2, sqrt(multiply(k, m)))); // damping ratio
  // const omega0 = sqrt(divide(k, m)); // undamped angular frequency of the oscillator (rad/ms)
  // const omega1 = multiply(omega0, sqrt(sub(1, multiply(zeta, zeta)))); // exponential decay

  // const t = divide(deltaTime, 1000); // in seconds

  // const sin1 = sin(multiply(omega1, t));
  // const cos1 = cos(multiply(omega1, t));

  // // under damped
  // const underDampedEnvelope = exp(multiply(-1, zeta, omega0, t));
  // const underDampedFrag1 = multiply(
  //   underDampedEnvelope,
  //   add(
  //     multiply(sin1, divide(add(v0, multiply(zeta, omega0, x0)), omega1)),
  //     multiply(x0, cos1),
  //   ),
  // );
  // const underDampedPosition = sub(config.toValue, underDampedFrag1);
  // // This looks crazy -- it's actually just the derivative of the oscillation function
  // const underDampedVelocity = sub(
  //   multiply(zeta, omega0, underDampedFrag1),
  //   multiply(
  //     underDampedEnvelope,
  //     sub(
  //       multiply(cos1, add(v0, multiply(zeta, omega0, x0))),
  //       multiply(omega1, x0, sin1),
  //     ),
  //   ),
  // );

  // // critically damped
  // const criticallyDampedEnvelope = exp(multiply(-1, omega0, t));
  // const criticallyDampedPosition = sub(
  //   config.toValue,
  //   multiply(
  //     criticallyDampedEnvelope,
  //     add(x0, multiply(add(v0, multiply(omega0, x0)), t)),
  //   ),
  // );
  // const criticallyDampedVelocity = multiply(
  //   criticallyDampedEnvelope,
  //   add(
  //     multiply(v0, sub(multiply(t, omega0), 1)),
  //     multiply(t, x0, omega0, omega0),
  //   ),
  // );

  // // conditions for stopping the spring animations
  // const prevPosition = state.prevPosition ? state.prevPosition : new Value(0);

  // const isOvershooting = cond(
  //   and(config.overshootClamping, neq(config.stiffness, 0)),
  //   cond(
  //     lessThan(prevPosition, config.toValue),
  //     greaterThan(state.position, config.toValue),
  //     lessThan(state.position, config.toValue),
  //   ),
  // );
  // const isVelocity = lessThan(abs(state.velocity), config.restSpeedThreshold);
  // const isDisplacement = or(
  //   eq(config.stiffness, 0),
  //   lessThan(
  //     abs(sub(config.toValue, state.position)),
  //     config.restDisplacementThreshold,
  //   ),
  // );

  // return block([
  //   set(prevPosition, state.position),
  //   cond(
  //     lessThan(zeta, 1),
  //     [
  //       set(state.position, underDampedPosition),
  //       set(state.velocity, underDampedVelocity),
  //     ],
  //     [
  //       set(state.position, criticallyDampedPosition),
  //       set(state.velocity, criticallyDampedVelocity),
  //     ],
  //   ),
  //   set(state.time, clock),
  //   cond(or(isOvershooting, and(isVelocity, isDisplacement)), [
  //     cond(neq(config.stiffness, 0), [
  //       set(state.velocity, 0),
  //       set(state.position, config.toValue),
  //     ]),
  //     set(state.finished, 1),
  //   ]),
  // ]);
}

export {spring};
