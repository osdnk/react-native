/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.ArrayList;
import java.util.List;

/*package*/ class ProcAnimatedNode extends ValueAnimatedNode {
  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int mExpression;
  private final ReadableArray mArgs;
  private final ReadableArray mParams;
  private List<ValueAnimatedNode> mArgNodes;
  private List<ValueAnimatedNode>  mParamNodes;
  private ValueAnimatedNode mExpressionNode;

  public ProcAnimatedNode(
    ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mArgs = config.getArray("args");
    mParams = config.getArray("params");
    mExpression = config.getInt("expression");

  }

  @Override
  public void update() {
    if(mArgNodes== null) {
      mArgNodes = new ArrayList<>(mArgs.size());
      for(int i=0; i<mArgs.size(); i++) {
        mArgNodes.add((ValueAnimatedNode)mNativeAnimatedNodesManager.getNodeById(mArgs.getInt(i)));
      }
    }
    if(mParamNodes== null) {
      mParamNodes = new ArrayList<>(mParams.size());
      for(int i=0; i<mParams.size(); i++) {
        mParamNodes.add((ValueAnimatedNode)mNativeAnimatedNodesManager.getNodeById(mParams.getInt(i)));
      }
    }
    if(mExpressionNode == null) {
      mExpressionNode = (ValueAnimatedNode)mNativeAnimatedNodesManager.getNodeById(mExpression);
    }

    for(int i=0; i<mArgNodes.size(); i++) {
      mParamNodes.get(i).mValue = mArgNodes.get(i).getValue();
    }

    if(mExpressionNode != null) {
      mExpressionNode.update();
      mValue = mExpressionNode.getValue();
    }
  }
}
