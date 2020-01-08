/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTClockAnimation.h>

#import <UIKit/UIKit.h>

#import <React/RCTConvert.h>
#import <React/RCTDefines.h>

#import <React/RCTAnimationUtils.h>
#import <React/RCTValueAnimatedNode.h>

@interface RCTClockAnimation ()

@property (nonatomic, strong) NSNumber *animationId;
@property (nonatomic, strong) RCTValueAnimatedNode *valueNode;
@property (nonatomic, assign) BOOL animationHasBegun;
@property (nonatomic, assign) BOOL animationHasFinished;

@end

@implementation RCTClockAnimation
{
  RCTResponseSenderBlock _callback;
}

- (instancetype)initWithId:(NSNumber *)animationId
                    config:(NSDictionary *)config
                   forNode:(RCTValueAnimatedNode *)valueNode
                  callBack:(nullable RCTResponseSenderBlock)callback
{
  if ((self = [super init])) {
    _animationId = animationId;
    _valueNode = valueNode;
    _callback = [callback copy];
    [self resetAnimationConfig:config];
  }
  return self;
}

- (void)resetAnimationConfig:(NSDictionary *)config
{
  
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)startAnimation
{
  _animationHasBegun = YES;
}

- (void)stopAnimation
{
  _valueNode = nil;
  if (_callback) {
    _callback(@[@{
      @"finished": @(_animationHasFinished)
    }]);
  }
}

- (void)stepAnimationWithTime:(NSTimeInterval)currentTime
{
  _valueNode.value = currentTime * 1000.;  
  [_valueNode setNeedsUpdate];
}


@end
