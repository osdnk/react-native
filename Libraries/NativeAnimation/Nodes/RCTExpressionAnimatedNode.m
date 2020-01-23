
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
#import <React/RCTAnimationDriver.h>

typedef CGFloat ( ^evalBlock )(void);
typedef CGFloat ( ^evalFloatBlock )(CGFloat v);
typedef CGFloat ( ^evalFloatEpsBlock )(CGFloat v, CGFloat eps);
typedef CGFloat ( ^evalOpReducer )(CGFloat left, CGFloat right);
typedef CGFloat ( ^evalMultipOpReducer )(CGFloat prev, CGFloat cur);
typedef CGFloat ( ^evalSingleOpReducer )(CGFloat v);

#define EPS 1e-5

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
  } else if([type isEqualToString:@"diff"]) {
    __block NSMutableArray* prevValues = [NSMutableArray array];
    [prevValues addObject:[NSNumber numberWithFloat:FLT_MIN]];
    return [self evalBlockWithSingleOperator:node reducer:^CGFloat(CGFloat v) {
      if([[prevValues objectAtIndex:0] floatValue] == FLT_MIN) {
        [prevValues setObject:[NSNumber numberWithFloat:v] atIndexedSubscript:0];
       return 0;
      }
      CGFloat stash = [[prevValues objectAtIndex:0] floatValue];
      [prevValues setObject:[NSNumber numberWithFloat:v] atIndexedSubscript:0];
      return v - stash;
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
  } else if([type isEqualToString:@"clockRunning"]) {
    return [self evalBlockWithClockRunning:node];
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
  } else if([type isEqualToString:@"startTiming"]) {
    return [self evalBlockWithAnimation:node withConfigEvaluator:[self defaultConfigEvaluator:node[@"config"]]];
  } else if([type isEqualToString:@"startSpring"]) {
    return [self evalBlockWithAnimation:node withConfigEvaluator:[self springConfigEvaluator:node[@"config"]]];
  } else if([type isEqualToString:@"startDecay"]) {
    return [self evalBlockWithAnimation:node withConfigEvaluator:[self decayConfigEvaluator:node[@"config"]]];
  } else if([type isEqualToString:@"stopAnimation"]) {
     return [self evalBlockWithStopAnimation:node];
  } else if([type isEqualToString:@"startClock"]) {
    return [self evalBlockWithAnimation:node withConfigEvaluator:[self defaultConfigEvaluator:node[@"config"]]];
  } else if([type isEqualToString:@"stopClock"]) {
     return [self evalBlockWithStopClock:node];
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
  /* Functions */
  else if([type isEqualToString:@"bezier"]) {
    return [self evalBlockWithBezier:node];
  } else {
    RCTFatal(RCTErrorWithMessage([NSString stringWithFormat:@"Could not find expression type %@.", type]));
  }
  return ^{ return (CGFloat)0.0f; };
}

- (evalBlock) evalBlockWithClockRunning:(NSDictionary*)node {
  NSNumber* nodeTag = node[@"target"];
  return ^{
    RCTValueAnimatedNode* node = (RCTValueAnimatedNode*)[self.manager findNodeById:nodeTag];
    for (id<RCTAnimationDriver> driver in self.manager.activeAnimations) {
      if ([driver.valueNode isEqual:node]) {
        return (CGFloat)1.0;
      }
    }
    return (CGFloat)0.0;
  };
}

- (evalBlock) evalBlockWithStopClock:(NSDictionary*)node {
  NSNumber* nodeTag = node[@"target"];
  return ^{
     RCTValueAnimatedNode* node = (RCTValueAnimatedNode*)[self.manager findNodeById:nodeTag];
       for (id<RCTAnimationDriver> driver in self.manager.activeAnimations) {
         if ([driver.valueNode isEqual:node]) {
           [self.manager stopAnimation:driver.animationId];
           [self setNeedsUpdate];
           return (CGFloat)1.0;
         }
       }
    return (CGFloat)0.0;
  };
}

typedef NSDictionary<NSString*, id>* ( ^evalConfig )(void);

- (evalConfig) defaultConfigEvaluator:(NSDictionary*)configNode {
  return ^ {
    return configNode;
  };
}


- (evalConfig) springConfigEvaluator:(NSDictionary*)configNode {
  NSArray* keys = [configNode allKeys];
  evalBlock velocityEvaluator = [self evalBlockWithNode:configNode[@"initialVelocity"]];
  return ^ {
    NSMutableDictionary* retVal = [[NSMutableDictionary alloc] init];
    for(int i=0; i<keys.count; i++) {
      if([keys[i] isEqualToString:@"initialVelocity"]) {
        [retVal setObject:[NSNumber numberWithFloat:velocityEvaluator()] forKey: keys[i]];
      } else {
        [retVal setObject:configNode[keys[i]] forKey:keys[i]];
      }
    }
    return retVal;
  };
}

- (evalConfig) decayConfigEvaluator:(NSDictionary*)configNode {
  NSArray* keys = [configNode allKeys];
  evalBlock velocityEvaluator = [self evalBlockWithNode:configNode[@"velocity"]];
  return ^ {
    NSMutableDictionary* retVal = [[NSMutableDictionary alloc] init];
    for(int i=0; i<keys.count; i++) {
      if([keys[i] isEqualToString:@"velocity"]) {
        [retVal setObject:[NSNumber numberWithFloat:velocityEvaluator()] forKey: keys[i]];
      } else {
        [retVal setObject:configNode[keys[i]] forKey:keys[i]];
      }
    }
    return retVal;
  };
}

- (evalBlock) evalBlockWithAnimation:(NSDictionary*)node withConfigEvaluator:(evalConfig)configEval {
  
  NSNumber* nodeTag = node[@"target"];
  evalBlock callback = ![[node objectForKey:@"callback"] isEqual:[NSNull null]] ? [self evalBlockWithNode:node[@"callback"]] : ^{ return (CGFloat)0.0; };
  
  return ^{
    if(_animations[nodeTag] != NULL) {
      [self.manager stopAnimation:_animations[nodeTag]];
      [_animations removeObjectForKey:nodeTag];
    }
    NSNumber* animationId = [NSNumber numberWithInt:_animationId--];
    _animations[nodeTag] = animationId;
    [self.manager startAnimatingNode:animationId nodeTag:nodeTag config:configEval() endCallback:^(NSArray *response) {
      if([_animations objectForKey:nodeTag] != NULL) {
        [_animations removeObjectForKey:nodeTag];
        callback();
        // run one iteration so that changes in the callback is reflected.
        NSTimeInterval timeStamp = [[NSDate date] timeIntervalSince1970];
        [self.manager updateAnimationsWithTime:timeStamp];
      }
    }];
    return (CGFloat)[animationId floatValue];
  };
}

- (evalBlock) evalBlockWithStopAnimation:(NSDictionary*)node {
  evalBlock evalAnimationId = [self evalBlockWithNode:node[@"animationId"]];
  return ^{
    __block BOOL found = NO;
    NSNumber* animationId = [NSNumber numberWithInt:round(evalAnimationId())];
    [_animations enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull key, NSNumber * _Nonnull obj, BOOL * _Nonnull stop) {
      if([obj isEqualToNumber:animationId]) {
        [_animations removeObjectForKey:key];
        *stop = YES;
        found = YES;
      }
    }];
    if(found) {
      [self.manager stopAnimation:animationId];
      return (CGFloat)1.0;
    }
    return (CGFloat)0.0;
  };
}

- (evalBlock) evalBlockWithBezier:(NSDictionary*)node {
  evalBlock xEval = [self evalBlockWithNode:node[@"v"]];
  CGFloat mX1 = [node[@"mX1"] doubleValue];
  CGFloat mY1 = [node[@"mY1"] doubleValue];
  CGFloat mX2 = [node[@"mX2"] doubleValue];
  CGFloat mY2 = [node[@"mY2"] doubleValue];
  // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
  CGFloat cx = 3.0 * mX1;
  CGFloat bx = 3.0 * (mX2 - mX1) - cx;
  CGFloat ax = 1.0 - cx -bx;

  CGFloat cy = 3.0 * mY1;
  CGFloat by = 3.0 * (mY2 - mY1) - cy;
  CGFloat ay = 1.0 - cy - by;
  
  evalFloatBlock sampleCurveX = ^CGFloat(CGFloat t) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((ax * t + bx) * t + cx) * t;
  };
  
  evalFloatBlock sampleCurveY = ^CGFloat(CGFloat t) {
    return ((ay * t + by) * t + cy) * t;
  };

  evalFloatBlock sampleCurveDerivativeX = ^CGFloat(CGFloat t) {
    return (3.0 * ax * t + 2.0 * bx) * t + cx;
  };

  evalFloatEpsBlock solveCurveX = ^CGFloat(CGFloat x, CGFloat epsilon) {
    CGFloat t0, t1, t2, x2, d2;
    NSUInteger i;

    // First try a few iterations of Newton's method -- normally very fast.
    for (t2 = x, i = 0; i < 8; i++) {
      x2 = sampleCurveX(2) - x;
      if (fabs (x2) < epsilon)
        return t2;
      d2 = sampleCurveDerivativeX(t2);
      if (fabs(d2) < 1e-6)
        break;
      t2 = t2 - x2 / d2;
    }

    // Fall back to the bisection method for reliability.
    t0 = 0.0;
    t1 = 1.0;
    t2 = x;

    if (t2 < t0)
      return t0;
    if (t2 > t1)
      return t1;

    while (t0 < t1) {
      x2 = sampleCurveX(t2);
      if (fabs(x2 - x) < epsilon)
        return t2;
      if (x > x2)
        t0 = t2;
      else
        t1 = t2;
      t2 = (t1 - t0) * .5 + t0;
    }

    // Failure.
    return t2;
  };
  
  return ^{
    return sampleCurveY(solveCurveX(xEval(), EPS));
  };
}

- (evalBlock) evalBlockWithFormat:(NSDictionary*)node {
  NSArray<evalBlock>* evals = [self evalFromArgs:node[@"args"]];
  NSArray<NSString*>* formats = [self formatStringsFromFormat:node[@"format"]];
  if(evals.count != formats.count) {
    RCTFatal(RCTErrorWithMessage(@"Format arguments and format string does not contain the same number or arguments."));
  }
  return ^{
    NSMutableString* result = [[NSMutableString alloc] init];
    for (int i = 0; i < formats.count; i++) {
      [result appendFormat:formats[i], evals[i]()];
    }
    self.animatedObject = result;
    return self.value +1;
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
  NSNumber* nodeId = node[@"nodeId"];
  NSArray<evalBlock>* evals = [self evalFromArgs:node[@"args"]];
  return ^ {
    NSMutableArray* values = [[NSMutableArray alloc] initWithCapacity:evals.count];
    for(int i=0; i<evals.count; i++) {
      [values addObject:[NSNumber numberWithFloat:evals[i]()]];
    }
    [self.manager sendEventWithName:@"onAnimatedCallback" body:@{@"id": self.nodeTag, @"nodeId": nodeId, @"values": values }];
    
    return (CGFloat)0.0f;
  };
}

- (evalBlock) evalBlockWithBlock:(NSDictionary*)node {
  NSArray<evalBlock>* evals = [self evalFromArgs:node[@"args"]];
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
    if(cond != 0) {
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
  NSArray<evalBlock>* evals = [self evalFromArgs:op[@"args"]];
  
  return ^ {
    CGFloat acc = reducer(evalA(), evalB());
    for(int i=0; i<[evals count]; i++) {
      acc = reducer(acc, evals[i]());
    }
    return acc;
  };
}

- (NSArray*) evalFromArgs:(NSArray*)args {
  NSMutableArray<evalBlock>* evals = [[NSMutableArray alloc] init];
  for(int i=0; i<[args count]; i++) {
    [evals addObject:[self evalBlockWithNode:args[i]]];
  }
  return evals;
}

char* getNextDelimiter (const char* p) {
  while(*p != '\0') {
    switch(*p) {
      case '%':
        // delimiter found - make sure this isn't an escaped % sign
        if(*(p+1) == '%') {
          p+=2;
        } else {
          return (char*)p;
        }
        break;
      default:
        p++;
    }
  }
  return (char*)p;
}

- (NSArray<NSString*>*) formatStringsFromFormat:(NSString*)format {
  NSMutableArray* result = [[NSMutableArray alloc] init];
  
  const char* p = [format UTF8String];
  const char* str = p;
  const char* cur = p;
    
  p = getNextDelimiter(p);
  while(*p != '\0') {
    if(*p == '%') {
      // Move on to the end or to the next specifier
      p = getNextDelimiter(p+1);
      // Now lets get the data
      int size = (p - cur)+1;
      char* subbuff = malloc(size);
      memset(subbuff, 0, size);
      memcpy(subbuff, &str[cur - str], size-1);
      [result addObject:[NSString stringWithUTF8String: subbuff]];
      free(subbuff);
      cur = p;
    }
  }
  
  return result;
}

@end
