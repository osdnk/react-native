/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import <React/RCTUIManagerUtils.h>

#import "RCTValueAnimatedNode.h"

@interface RCTNativeAnimatedModule : RCTEventEmitter <RCTBridgeModule, RCTValueAnimatedNodeObserver, RCTEventDispatcherObserver, RCTUIManagerObserver, RCTSurfacePresenterObserver>

- (void)configureProps:(NSArray<NSString*>*_Nonnull)nativeProps uiProps:(NSArray<NSString*>*_Nonnull)uiProps;

#pragma mark -- API

- (void) createAnimatedNode:(double)tag
                     config:(NSDictionary<NSString *, id> *_Nonnull)config;

- (void) connectAnimatedNodes:(double)parentTag
                     childTag:(double)childTag;

- (void)disconnectAnimatedNodes:(double)parentTag
                       childTag:(double)childTag;

- (void)startAnimatingNode:(double)animationId
                   nodeTag:(double)nodeTag
                    config:(NSDictionary<NSString *, id> *_Nonnull)config
               endCallback:(RCTResponseSenderBlock _Nonnull )callBack;

- (void)stopAnimation:(double)animationId;

- (void)setAnimatedNodeValue:(double)nodeTag
                       value:(double)value;

- (void)setAnimatedNodeOffset:(double)nodeTag
                       offset:(double)offset;

- (void)flattenAnimatedNodeOffset:(double)nodeTag;

- (void)extractAnimatedNodeOffset:(double)nodeTag;

- (void)connectAnimatedNodeToView:(double)nodeTag
                          viewTag:(double)viewTag;

- (void)disconnectAnimatedNodeFromView:(double)nodeTag
                               viewTag:(double)viewTag;

- (void)restoreDefaultValues:(double)nodeTag;

- (void)dropAnimatedNode:(double)tag;

- (void)startListeningToAnimatedNodeValue:(double)tag;

- (void)stopListeningToAnimatedNodeValue:(double)tag;

- (void)addAnimatedEventToView:(double)viewTag
                     eventName:(nonnull NSString *)eventName
                  eventMapping:(NSDictionary*_Nonnull)eventMapping;

- (void)removeAnimatedEventFromView:(double)viewTag
                  eventName:(nonnull NSString *)eventName
                    animatedNodeTag:(double)animatedNodeTag;
  
@end
