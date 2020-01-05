
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTExpressionAnimatedNode.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTNativeAnimatedNodesManager.h>
#import <React/RCTValueAnimatedNode.h>

typedef CGFloat ( ^evalBlock )(void);
typedef CGFloat ( ^evalOpReducer )(CGFloat left, CGFloat right);
typedef CGFloat ( ^evalMultipOpReducer )(CGFloat prev, CGFloat cur);
typedef CGFloat ( ^evalSingleOpReducer )(CGFloat v);

NSMutableDictionary<NSNumber*, NSNumber*>* _animations;
int _animationId = -1;

@implementation RCTExpressionAnimatedNode
{
  evalBlock _evalBlock;
  NSDictionary* _expression;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if (self = [super initWithTag:tag config:config]) {
    _expression = config[@"expression"];
    if(_animations == NULL) {
      _animations = [[NSMutableDictionary alloc] init];
    }
  }

  return self;
}

- (void)performUpdate
{
  [super performUpdate];
  if(!_evalBlock) {
    _evalBlock = [self evalBlockWithNode:_expression];
  }
  
  self.value = _evalBlock();
}

- (evalBlock) evalBlockWithNode:(NSDictionary*)node {
  NSString* type = node[@"type"];
  /* Multi operators */
  if([type isEqualToString:@"add"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return prev + cur;
    }];
  } else if([type isEqualToString:@"sub"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return prev - cur;
    }];
  } else if([type isEqualToString:@"multiply"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return prev * cur;
    }];
  } else if([type isEqualToString:@"divide"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return prev / cur;
    }];
  } else if([type isEqualToString:@"pow"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return pow(prev, cur);
    }];
  } else if([type isEqualToString:@"modulo"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return fmodf(fmodf(prev, cur) + cur, cur);
    }];
  } else if([type isEqualToString:@"max"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return fmax(prev, cur);
    }];
  } else if([type isEqualToString:@"min"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return fmin(prev, cur);
    }];
  }
  /* Single operators*/
  else if([type isEqualToString:@"abs"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return fabs(v);
    }];
  } else if([type isEqualToString:@"sqrt"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return sqrt(v);
    }];
  } else if([type isEqualToString:@"log"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return log(v);
    }];
  } else if([type isEqualToString:@"sin"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return sin(v);
    }];
  } else if([type isEqualToString:@"cos"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return cos(v);
    }];
  } else if([type isEqualToString:@"tan"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return tan(v);
    }];
  } else if([type isEqualToString:@"acos"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return acos(v);
    }];
  } else if([type isEqualToString:@"asin"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return asin(v);
    }];
  } else if([type isEqualToString:@"atan"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return atan(v);
    }];
  } else if([type isEqualToString:@"exp"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return exp(v);
    }];
  } else if([type isEqualToString:@"round"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return round(v);
    }];
  }else if([type isEqualToString:@"ceil"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return ceil(v);
    }];
  }else if([type isEqualToString:@"floor"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return floor(v);
    }];
  }
  /* Logical */
  else if([type isEqualToString:@"and"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return prev && cur;
    }];
  } else if([type isEqualToString:@"or"]) {
    return [self evalBlockWithMultiOperator:node reducer:^CGFloat(CGFloat prev, CGFloat cur) {
      return prev || cur;
    }];
  } else if([type isEqualToString:@"not"]) {
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      return !v;
    }];
  }
  /* Comparsion */
  else if([type isEqualToString:@"eq"]) {
    return [self evalBlockWithOperator:node reducer:^CGFloat(CGFloat left, CGFloat right) {
      return left == right;
    }];
  } else if([type isEqualToString:@"neq"]) {
    return [self evalBlockWithOperator:node reducer:^CGFloat(CGFloat left, CGFloat right) {
      return left != right;
    }];
  } else if([type isEqualToString:@"lessThan"]) {
    return [self evalBlockWithOperator:node reducer:^CGFloat(CGFloat left, CGFloat right) {
      return left < right;
    }];
  } else if([type isEqualToString:@"greaterThan"]) {
    return [self evalBlockWithOperator:node reducer:^CGFloat(CGFloat left, CGFloat right) {
      return left > right;
    }];
  } else if([type isEqualToString:@"lessOrEq"]) {
    return [self evalBlockWithOperator:node reducer:^CGFloat(CGFloat left, CGFloat right) {
      return left <= right;
    }];
  } else if([type isEqualToString:@"greaterOrEq"]) {
    return [self evalBlockWithOperator:node reducer:^CGFloat(CGFloat left, CGFloat right) {
      return left >= right;
    }];
  }
  /* Statements */
  else if([type isEqualToString:@"cond"]) {
    return [self evalBlockWithCondition: node];
  } else if([type isEqualToString:@"set"]) {
    return [self evalBlockWithSet:node];
  } else if([type isEqualToString:@"block"]) {
    return [self evalBlockWithBlock:node];
  } else if([type isEqualToString:@"call"]) {
    return [self evalBlockWithCall:node];
  } else if([type isEqualToString:@"timing"]) {
    return [self evalBlockWithAnimation:node];
  } else if([type isEqualToString:@"spring"]) {
    return [self evalBlockWithAnimation:node];
  } else if([type isEqualToString:@"decay"]) {
    return [self evalBlockWithAnimation:node];
  } else if([type isEqualToString:@"stopAnimation"]) {
     return [self evalBlockWithStopAnimation:node];
   }
  
  /* Conversion */
  else if([type isEqualToString:@"value"]) {
    return [self evalBlockWithAnimatedNode:node];
  } else if ([type isEqualToString:@"number"]) {
    return ^ { return (CGFloat)[node[@"value"] floatValue]; };
  } else if([type isEqualToString:@"format"]) {
    return [self evalBlockWithFormat:node];
  } else if([type isEqualToString:@"castBoolean"]) {
    return [self evalBlockWithCastBoolean:node];
  }
  return ^{ return (CGFloat)0.0f; };
}

- (evalBlock) evalBlockWithAnimation:(NSDictionary*)node {
  NSNumber* nodeTag = node[@"target"];
  NSDictionary* config = node[@"config"];
  evalBlock callback = node[@"callback"] ? [self evalBlockWithNode:node[@"callback"]] : ^{ return (CGFloat)0.0; };
  
  return ^{
    if(_animations[nodeTag] != NULL) {
      [self.manager stopAnimation:_animations[nodeTag]];
      [_animations removeObjectForKey:nodeTag];
    }
    NSNumber* animationId = [NSNumber numberWithInt:_animationId--];
    _animations[nodeTag] = animationId;
    [self.manager startAnimatingNode:animationId nodeTag:nodeTag config:config endCallback:^(NSArray *response) {
      [_animations removeObjectForKey:nodeTag];
      callback();
    }];
    return (CGFloat)[animationId floatValue];
  };
}

- (evalBlock) evalBlockWithStopAnimation:(NSDictionary*)node {
  NSNumber* animationId = node[@"animationId"];
  return ^{
    __block BOOL found = NO;
    [_animations enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull key, NSNumber * _Nonnull obj, BOOL * _Nonnull stop) {
      if([obj isEqualToNumber:animationId]) {
        [_animations removeObjectForKey:key];
        *stop = YES;
        found = YES;
      }
    }];
    if(found) {
      [self.manager stopAnimation:animationId];
      return (CGFloat)0.0;
    }
    return (CGFloat)0.0;
  };
}

- (evalBlock) evalBlockWithFormat:(NSDictionary*)node {
  NSArray* args = node[@"args"];
  NSString* format = node[@"format"];
  NSMutableArray<evalBlock>* evals = [[NSMutableArray alloc] init];
  for(int i=0; i<[args count]; i++) {
    [evals addObject:[self evalBlockWithNode:args[i]]];
  }
  
  return ^{
    double* argList = calloc(1UL, sizeof(double) * evals.count);
    for (int i = 0; i < evals.count; i++) {
       argList[i] = evals[i]();
    }
    NSString* result = [[NSString alloc] initWithFormat:format, *argList];
    free (argList);
    
    self.animatedObject = result;
    return (CGFloat)0.0f;
  };
}

- (evalBlock) evalBlockWithCastBoolean:(NSDictionary*)node {
  evalBlock evaluator = [self evalBlockWithNode:node[@"v"]];
  return ^{
    self.animatedObject = [NSNumber numberWithBool: evaluator() == 0 ? false : true];
    return (CGFloat)0.0f;
  };
}

- (evalBlock) evalBlockWithCall:(NSDictionary*)node {
  NSArray* args = node[@"args"];
  NSNumber* nodeId = node[@"nodeId"];
  NSMutableArray<evalBlock>* evals = [[NSMutableArray alloc] init];
  for(int i=0; i<[args count]; i++) {
    [evals addObject:[self evalBlockWithNode:args[i]]];
  }
  
  return ^ {
    NSMutableArray* values = [[NSMutableArray alloc] initWithCapacity:[args count]];
    for(int i=0; i<evals.count; i++) {
      [values addObject:[NSNumber numberWithFloat:evals[i]()]];
    }
    [self.manager sendEventWithName:@"onAnimatedCallback" body:@{@"id": self.nodeTag, @"nodeId": nodeId, @"values": values }];
    
    return (CGFloat)0.0f;
  };
}

- (evalBlock) evalBlockWithBlock:(NSDictionary*)node {
  NSArray* nodes = node[@"args"];
  NSMutableArray<evalBlock>* evals = [[NSMutableArray alloc] init];
  for(int i=0; i<[nodes count]; i++) {
    [evals addObject:[self evalBlockWithNode:nodes[i]]];
  }
  return ^ {
    CGFloat retVal = 0.0f;
    for(int i=0; i<evals.count; i++) {
      retVal = evals[i]();
    }    
    return retVal;
  };
}

- (evalBlock) evalBlockWithAnimatedNode:(NSDictionary*)node {
  NSNumber* tag = node[@"tag"];
  RCTValueAnimatedNode* animatedNode = (RCTValueAnimatedNode*)[self.manager findNodeById:tag];
  return ^ {
    return animatedNode.value;
  };
}

- (evalBlock) evalBlockWithSet:(NSDictionary*)node {
  evalBlock source = [self evalBlockWithNode:node[@"source"]];
  NSNumber* targetTag = node[@"target"];
  return ^ {
    CGFloat value = source();
    [self.manager setAnimatedNodeValue:targetTag value:[NSNumber numberWithFloat:value]];
    return value;
  };
}


- (evalBlock) evalBlockWithCondition:(NSDictionary*)op {
  evalBlock evalExpr = [self evalBlockWithNode:op[@"expr"]];
  evalBlock evalTrue = [self evalBlockWithNode:op[@"ifNode"]];
  evalBlock evalFalse = [self evalBlockWithNode:op[@"elseNode"]];
  return ^{
    CGFloat cond = evalExpr();
    if(cond == TRUE) {
      return evalTrue();
    } else {
      return evalFalse();
    }
  };
}

- (evalBlock) evalBlockWithOperator:(NSDictionary*)op reducer:(evalOpReducer)reducer {
  evalBlock evalLeft = [self evalBlockWithNode:op[@"left"]];
  evalBlock evalRight = [self evalBlockWithNode:op[@"right"]];
  return ^ {
    return reducer(evalLeft(), evalRight());
  };
}

- (evalBlock) evalBlockWithSingleOperator:(NSDictionary*)op reducer:(evalSingleOpReducer)reducer {
  evalBlock evalV = [self evalBlockWithNode:op[@"v"]];
  return ^ {
    return reducer(evalV());
  };
}

- (evalBlock) evalBlockWithMultiOperator:(NSDictionary*)op reducer:(evalMultipOpReducer)reducer {
  evalBlock evalA = [self evalBlockWithNode:op[@"a"]];
  evalBlock evalB = [self evalBlockWithNode:op[@"b"]];
  NSArray* others = op[@"args"];
  NSMutableArray<evalBlock>* evalOthers = [[NSMutableArray alloc] init];
  for(int i=0; i<[others count]; i++) {
    [evalOthers addObject:[self evalBlockWithNode:others[i]]];
  }
  
  return ^ {
    CGFloat acc = reducer(evalA(), evalB());
    for(int i=0; i<[evalOthers count]; i++) {
      acc = reducer(acc, evalOthers[i]());
    }
    return acc;
  };
}

@end
