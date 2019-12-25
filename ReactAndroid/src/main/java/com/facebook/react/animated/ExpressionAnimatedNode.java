/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import android.util.Log;
import android.util.SparseArray;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.ArrayList;
import java.util.List;

/*package*/ class ExpressionAnimatedNode extends ValueAnimatedNode {

  interface EvalFunction {
    double eval();
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
  private final ReadableMap mGraph;
  private EvalFunction mEvalFunc;

  public ExpressionAnimatedNode(
    ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mGraph = config.getMap("graph");
  }

  @Override
  public void update() {
    if(mEvalFunc == null) {
      mEvalFunc = createEvalFunc(mGraph);
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
      /* Single ops */
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
      default:
        return new EvalFunction() {
          @Override
          public double eval() { return 0; }
        };
    }
  }

  private EvalFunction createBlock(ReadableMap node) {
    ReadableArray nodes = node.getArray("nodes");
    final List<EvalFunction> evalfunctions= new ArrayList<>(1);
    for(int i=0; i<nodes.size(); i++) {
      evalfunctions.add(createEvalFunc(nodes.getMap(i)));
    }

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
        return isTrue(cond) ? ifNode.eval() : elseNode.eval();
      }
    };
  }

  private EvalFunction createMultiOp(ReadableMap node, final ReduceMulti reducer) {
    final EvalFunction a = createEvalFunc(node.getMap("a"));
    final EvalFunction b = createEvalFunc(node.getMap("b"));
    ReadableArray others = node.getArray("others");
    final List<EvalFunction> othersMapped= new ArrayList<>(1);
    for(int i=0; i<others.size(); i++) {
      othersMapped.add(createEvalFunc(others.getMap(i)));
    }

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
}
