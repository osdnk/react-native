/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTProcAnimatedNode.h>
#import <React/RCTNativeAnimatedNodesManager.h>
#import <React/RCTValueAnimatedNode.h>

@implementation RCTProcAnimatedNode
{
  NSNumber* _expression;
  NSArray<NSNumber*>* _args;
  NSArray<NSNumber*>* _params;
  
  RCTValueAnimatedNode* _expressionNode;
  NSMutableArray<RCTValueAnimatedNode*>* _argNodes;
  NSMutableArray<RCTValueAnimatedNode*>* _paramNodes;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if (self = [super initWithTag:tag config:config]) {
    _params = config[@"params"];
    _args = config[@"args"];
    _expression = config[@"expression"];
  }
  return self;
}

- (void)performUpdate
{
  [super performUpdate];
  if(_expressionNode == NULL) {
    _expressionNode = (RCTValueAnimatedNode*)[self.manager findNodeById:_expression];
  }
  if(_argNodes == NULL) {
    _argNodes = [[NSMutableArray alloc ] init];
    for(int i=0; i<_args.count; i++) {
      [_argNodes addObject: (RCTValueAnimatedNode*)[self.manager findNodeById:_args[i]]];
    }
  }
  if(_paramNodes == NULL) {
    _paramNodes = [[NSMutableArray alloc ] init];
    for(int i=0; i<_params.count; i++) {
      [_paramNodes addObject: (RCTValueAnimatedNode*)[self.manager findNodeById:_params[i]]];
    }
  }
  for(int i=0; i<_argNodes.count; i++) {
    _paramNodes[i].value = _argNodes[i].value;
  }
    
  [_expressionNode performUpdate];
  self.value = _expressionNode.value;
}

@end
