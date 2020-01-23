/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import android.util.SparseArray;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/*package*/ class ExpressionAnimatedNode extends ValueAnimatedNode {

  interface EvalFunction {
    double eval();
  }

  interface EvalConfig {
    ReadableMap eval();
  }

  interface ReduceMulti {
    double reduce(double prev, double cur);
  }

  interface ReduceSingle {
    double reduce(double v);
  }

  interface Reduce {
    double reduce(double left, double right);
  }

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final ReadableMap mExpression;
  private EvalFunction mEvalFunc;

  private static HashMap<Integer, Integer> _animations;
  private static int _animationId = -1;

  public ExpressionAnimatedNode(
    ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mExpression = config.getMap("expression");
    if(_animations == null) {
      _animations = new HashMap<>();
    }
  }

  @Override
  public void update() {
    if(mEvalFunc == null) {
      mEvalFunc = createEvalFunc(mExpression);
    }
    mValue = mEvalFunc.eval();
  }

  private static boolean isTrue(Object value) {
    return value != null && !value.equals(0.);
  }

  private EvalFunction createEvalFunc(final ReadableMap node) {
    String type = node.getString("type");
    switch (type) {
      /* Multi ops */
      case "add": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double prev, double cur) {
          return prev + cur;
        }
      });
      case "sub": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double prev, double cur) {
          return prev - cur;
        }
      });
      case "multiply": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double prev, double cur) {
          return prev * cur;
        }
      });
      case "divide": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double prev, double cur) {
          return prev / cur;
        }
      });
      case "modulo": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double p, double c) {
          return ((p % c) + c) % c;
        }
      });
      case "pow": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double p, double c) {
          return Math.pow(p, c);
        }
      });
      case "max": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double p, double c) {
          return Math.max(p, c);
        }
      });
      case "min": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double p, double c) {
          return Math.min(p, c);
        }
      });
      /* Single ops */
      case "abs": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.abs(v);
        }
      });
      case "sqrt": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.sqrt(v);
        }
      });
      case "log": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.log(v);
        }
      });
      case "sin": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.sin(v);
        }
      });
      case "cos": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.cos(v);
        }
      });
      case "tan": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.tan(v);
        }
      });
      case "acos": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.acos(v);
        }
      });
      case "asin": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.asin(v);
        }
      });
      case "atan": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.atan(v);
        }
      });
      case "exp": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.exp(v);
        }
      });
      case "round": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.round(v);
        }
      });
      case "ceil": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.ceil(v);
        }
      });
      case "floor": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return Math.floor(v);
        }
      });
      /* Logical */
      case "and": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double p, double c) {
          return isTrue(p) && isTrue(c) ? 1.0 : 0.0;
        }
      });
      case "or": return createMultiOp(node, new ReduceMulti() {
        @Override
        public double reduce(double p, double c) {
          return isTrue(p) || isTrue(c) ? 1.0 : 0.0;
        }
      });
      case "not": return createSingleOp(node, new ReduceSingle() {
        @Override
        public double reduce(double v) {
          return !isTrue(v) ? 1 : 0;
        }
      });
      /* Comparsion */
      case "eq": return createOp(node, new Reduce() {
        @Override
        public double reduce(double left, double right) {
          return left == right? 1.0 : 0.0;
        }
      });
      case "neq": return createOp(node, new Reduce() {
        @Override
        public double reduce(double left, double right) {
          return left != right ? 1.0 : 0.0;
        }
      });
      case "lessThan": return createOp(node,new Reduce() {
        @Override
        public double reduce(double left, double right) {
          return left < right ? 1.0 : 0.0;
        }
      });
      case "greaterThan": return createOp(node, new Reduce() {
        @Override
        public double reduce(double left, double right) {
          return left > right? 1.0 : 0.0;
        }
      });
      case "lessOrEq": return createOp(node, new Reduce() {
        @Override
        public double reduce(double left, double right) {
          return left <= right? 1.0 : 0.0;
        }
      });
      case "greaterOrEq": return createOp(node, new Reduce() {
        @Override
        public double reduce(double left, double right) {
          return left >= right? 1.0 : 0.0;
        }
      });
      case "diff": return createDiff(node);
      /* Variables */
      case "value" : {
        int nodeId = node.getInt("tag");
        final ValueAnimatedNode animatedNode = (ValueAnimatedNode)mNativeAnimatedNodesManager.getNodeById(nodeId);
        if(animatedNode != null ) {
          return new EvalFunction() {
            @Override
            public double eval() {
              return animatedNode.getValue();
            }
          };
        }
        else {
          return new EvalFunction() {
            @Override
            public double eval() { return 0; }
          };
        }
      }
      case "number": return new EvalFunction() {
        @Override
        public double eval() { return node.getDouble("value"); }
      };
      /* Statements */
      case "cond": return createCond(node);
      case "set": return createSet(node);
      case "block": return createBlock(node);
      case "call": return createCall(node);
      case "format": return createFormat(node);
      case "castBoolean": return createCastBoolean(node);
      case "startTiming":
      case "startClock":
        return createAnimation(node, getDefaultConfigEvaluator(node.getMap("config")));
      case "startSpring":
        return createAnimation(node, getSpringConfigEvaluator(node.getMap("config")));
      case "startDecay":
        return createAnimation(node, getDecayConfigEvaluator(node.getMap("config")));
      case "stopAnimation": return createStopAnimation(node);
      case "stopClock": return createStopClock(node);
      case "clockRunning": return createClockRunning(node);
      case "bezier": return createBezier(node);
      default:
        return new EvalFunction() {
          @Override
          public double eval() { return 0; }
        };
    }
  }

  private EvalFunction createBezier(ReadableMap node) {
    final EvalFunction xEval = createEvalFunc(node.getMap("v"));
    float startX = (float) node.getDouble("mX1");
    float startY = (float) node.getDouble("mY1");
    float endX = (float) node.getDouble("mX2");
    float endY = (float) node.getDouble("mY2");
    final CubicBezierInterpolator interpolator = new CubicBezierInterpolator(startX, startY, endX, endY);
    return new EvalFunction() {
      @Override
      public double eval() {
        Double in = xEval.eval();
        return Double.valueOf(interpolator.getInterpolation(in.floatValue()));
      }
    };
  }

  private EvalFunction createClockRunning(ReadableMap node) {
    final int targetTag = node.getInt("target");
    return new EvalFunction() {
      @Override
      public double eval() {
        SparseArray<AnimationDriver> animations = mNativeAnimatedNodesManager.getAnimations();
        ValueAnimatedNode node = (ValueAnimatedNode)mNativeAnimatedNodesManager.getNodeById(targetTag);
        for(int i=0; i<animations.size(); i++) {
          if(animations.valueAt(i).mAnimatedValue == node) {
            return 1;
          }
        }
        return 0;
      }
    };
  }

  private EvalFunction createStopClock(ReadableMap node) {
    final int targetTag = node.getInt("target");
    return new EvalFunction() {
      @Override
      public double eval() {
        SparseArray<AnimationDriver> animations = mNativeAnimatedNodesManager.getAnimations();
        ValueAnimatedNode node = (ValueAnimatedNode)mNativeAnimatedNodesManager.getNodeById(targetTag);
        for(int i=0; i<animations.size(); i++) {
          if(animations.valueAt(i).mAnimatedValue == node) {
            mNativeAnimatedNodesManager.stopAnimation(animations.valueAt(i).mId);
            return 1;
          }
        }
        return 0;
      }
    };
  }

  private EvalConfig getDefaultConfigEvaluator(final ReadableMap configNode) {
    return new EvalConfig() {
      @Override
      public ReadableMap eval() {
        return configNode;
      }
    };
  }

  private EvalConfig getDecayConfigEvaluator(final ReadableMap configNode) {
    final EvalFunction evalVelocity = createEvalFunc(configNode.getMap("velocity"));
    return new EvalConfig() {
      @Override
      public ReadableMap eval() {
        WritableMap result = new WritableNativeMap();
        ReadableMapKeySetIterator keyIterator = configNode.keySetIterator();
        while (keyIterator.hasNextKey()) {
          String propKey = keyIterator.nextKey();
          if(propKey.equals("type")) {
            result.putString("type", configNode.getString("type"));
          } else if(propKey.equals("velocity")) {
            result.putDouble(propKey, evalVelocity.eval());
          } else {
            result.putDouble(propKey, configNode.getDynamic(propKey).asDouble());
          }
        }
        return result;
      }
    };
  }

  private EvalConfig getSpringConfigEvaluator(final ReadableMap configNode) {
    final EvalFunction evalVelocity = createEvalFunc(configNode.getMap("initialVelocity"));
    return new EvalConfig() {
      @Override
      public ReadableMap eval() {
        WritableMap result = new WritableNativeMap();
        ReadableMapKeySetIterator keyIterator = configNode.keySetIterator();
        while (keyIterator.hasNextKey()) {
          String propKey = keyIterator.nextKey();
          if(propKey.equals("type")) {
            result.putString("type", configNode.getString("type"));
          } else if(propKey.equals("initialVelocity")) {
            result.putDouble(propKey, evalVelocity.eval());
          } else if(propKey.equals("overshootClamping")) {
            result.putBoolean(propKey, configNode.getBoolean("overshootClamping"));
          } else {
            result.putDouble(propKey, configNode.getDynamic(propKey).asDouble());
          }
        }
        return result;
      }
    };
  }

  private EvalFunction createAnimation(ReadableMap node, final EvalConfig configEvaluator) {
    final int targetTag = node.getInt("target");
    ReadableMap callback = node.getMap("callback");
    final EvalFunction callbackEval = callback != null ? createEvalFunc(callback) : null;

    return new EvalFunction() {
      @Override
      public double eval() {
        if(_animations.get(targetTag) != null) {
          mNativeAnimatedNodesManager.stopAnimation(_animations.get(targetTag));
          _animations.remove(targetTag);
        }
        final EvalFunction[] localFinishedCallback = {callbackEval};
        int animationId = _animationId--;
        _animations.put(targetTag, animationId);
        mNativeAnimatedNodesManager.startAnimatingNode(animationId, targetTag, configEvaluator.eval(), new Callback() {
          @Override
          public void invoke(Object... args) {
            _animations.remove(targetTag);
            if(localFinishedCallback[0] != null) {
              EvalFunction tmp = localFinishedCallback[0];
              localFinishedCallback[0] = null;
              tmp.eval();
            }
          }
        });
        return animationId;
      }
    };
  }

  private EvalFunction createStopAnimation(ReadableMap node) {
    final int animationId = node.getInt("animationId");
    return new EvalFunction() {
      @Override
      public double eval() {
        Iterator it = _animations.entrySet().iterator();
        while (it.hasNext()) {
          Map.Entry<Integer, Integer> pair = (Map.Entry)it.next();
          if(pair.getValue() == animationId) {
            _animations.remove(pair.getKey());
            mNativeAnimatedNodesManager.stopAnimation(animationId);
            break;
          }
        }
        return 0;
      }
    };
  }

  private EvalFunction createDiff(ReadableMap node) {
    final double[] prevValue = {Double.MIN_VALUE};
    final EvalFunction evaluator = createEvalFunc(node.getMap("v"));
    return new EvalFunction() {
      @Override
      public double eval() {
        double v = evaluator.eval();
        if(prevValue[0] == Double.MIN_VALUE) {
          prevValue[0] = v;
          return 0;
        }
        double stash = prevValue[0];
        prevValue[0]= v;
        return v - stash;
      }
    };
  }

  private EvalFunction createFormat(ReadableMap node) {
    final String format = node.getString("format");
    final List<EvalFunction> evalfunctions = createEvalFunctions(node.getArray("args"));

    return new EvalFunction() {
      @Override
      public double eval() {
        Object[] params = new Object[evalfunctions.size()];
        for(int i=0; i<evalfunctions.size(); i++) {
          params[i] = evalfunctions.get(i).eval();
        }
        mAnimatedObject = String.format(format, (Object[])params);
        return mValue + 1;
      }
    };
  }

  private EvalFunction createCastBoolean(ReadableMap node) {
    final EvalFunction evaluator = createEvalFunc(node.getMap("v"));
    return new EvalFunction() {
      @Override
      public double eval() {
        mAnimatedObject = evaluator.eval() == 0 ? false : true;
        return 0.0;
      }
    };
  }

  private EvalFunction createCall(ReadableMap node) {
    final int nodeId = node.getInt("nodeId");
    final List<EvalFunction> evalfunctions = createEvalFunctions(node.getArray("args"));

    return new EvalFunction() {
      @Override
      public double eval() {
        WritableNativeArray values = new WritableNativeArray();
        for(int i=0; i<evalfunctions.size(); i++) {
          values.pushDouble(evalfunctions.get(i).eval());
        }

        WritableMap eventData = Arguments.createMap();
        eventData.putInt("id", mTag);
        eventData.putInt("nodeId", nodeId);
        eventData.putArray("values", values);
        mNativeAnimatedNodesManager.sendEvent("onAnimatedCallback", eventData);

        return 0.0;
      }
    };
  }

  private EvalFunction createBlock(ReadableMap node) {
    final List<EvalFunction> evalfunctions = createEvalFunctions(node.getArray("args"));

    return new EvalFunction() {
      @Override
      public double eval() {
        double retVal = 0;
        for(int i=0; i<evalfunctions.size(); i++) {
          retVal = evalfunctions.get(i).eval();
        }
        return retVal;
      }
    };
  }

  private EvalFunction createSet(ReadableMap node) {
    final EvalFunction source = createEvalFunc(node.getMap("source"));
    int targetId = node.getInt("target");
    final ValueAnimatedNode targetNode = (ValueAnimatedNode)mNativeAnimatedNodesManager.getNodeById(targetId);
    return new EvalFunction() {
      @Override
      public double eval() {
        mNativeAnimatedNodesManager.setAnimatedNodeValue(targetNode.mTag, source.eval());
        return targetNode.mValue;
      }
    };
  }

  private EvalFunction createCond(ReadableMap node) {
    final EvalFunction expr = createEvalFunc(node.getMap("expr"));
    final EvalFunction ifNode = createEvalFunc(node.getMap("ifNode"));
    final EvalFunction elseNode = createEvalFunc(node.getMap("elseNode"));

    return new EvalFunction() {
      @Override
      public double eval() {
        double cond = expr.eval();
        return cond != 0 ? ifNode.eval() : elseNode.eval();
      }
    };
  }

  private EvalFunction createMultiOp(ReadableMap node, final ReduceMulti reducer) {
    final EvalFunction a = createEvalFunc(node.getMap("a"));
    final EvalFunction b = createEvalFunc(node.getMap("b"));
    final List<EvalFunction> othersMapped= createEvalFunctions(node.getArray("args"));

    return new EvalFunction() {
      @Override
      public double eval() {
        double acc = reducer.reduce(a.eval(), b.eval());
        for(int i=0; i<othersMapped.size(); i++) {
          acc = reducer.reduce(acc, othersMapped.get(i).eval());
        }
        return acc;
      }
    };
  }

  private EvalFunction createSingleOp(ReadableMap node, final ReduceSingle reducer) {
    final EvalFunction v = createEvalFunc(node.getMap("v"));
    return new EvalFunction() {
      @Override
      public double eval() {
        return reducer.reduce(v.eval());
      }
    };
  }

  private EvalFunction createOp(ReadableMap node, final Reduce reducer) {
    final EvalFunction left = createEvalFunc(node.getMap("left"));
    final EvalFunction right = createEvalFunc(node.getMap("right"));
    return new EvalFunction() {
      @Override
      public double eval() {
        return reducer.reduce(left.eval(), right.eval());
      }
    };
  }

  private List<EvalFunction> createEvalFunctions(ReadableArray args) {
    final List<EvalFunction> evalfunctions= new ArrayList<>(1);
    for(int i=0; i<args.size(); i++) {
      evalfunctions.add(createEvalFunc(args.getMap(i)));
    }
    return evalfunctions;
  }
}
