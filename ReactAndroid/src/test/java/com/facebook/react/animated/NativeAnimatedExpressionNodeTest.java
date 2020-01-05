/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atMost;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

/**
 * Tests the animated nodes graph traversal algorithm from
 * {@link NativeAnimatedNodesManager}.
 */
@PrepareForTest({ Arguments.class })
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({ "org.mockito.*", "org.robolectric.*", "androidx.*", "android.*" })
public class NativeAnimatedExpressionNodeTest {

  private static long FRAME_LEN_NANOS = 1000000000L / 60L;
  private static long INITIAL_FRAME_TIME_NANOS = 14599233201256L; /* random */

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private long mFrameTimeNanos;
  private UIManagerModule mUIManagerMock;
  private ReactApplicationContext mReactApplicationContextMock;
  private EventDispatcher mEventDispatcherMock;
  private NativeAnimatedNodesManager mNativeAnimatedNodesManager;

  private long nextFrameTime() {
    return mFrameTimeNanos += FRAME_LEN_NANOS;
  }

  @Before
  public void setUp() {
    PowerMockito.mockStatic(Arguments.class);
    PowerMockito.when(Arguments.createArray()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyArray();
      }
    });
    PowerMockito.when(Arguments.createMap()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyMap();
      }
    });

    mFrameTimeNanos = INITIAL_FRAME_TIME_NANOS;
    mUIManagerMock = mock(UIManagerModule.class);
    mReactApplicationContextMock = mock(ReactApplicationContext.class);
    mEventDispatcherMock = mock(EventDispatcher.class);
    PowerMockito.when(mUIManagerMock.getEventDispatcher()).thenAnswer(new Answer<EventDispatcher>() {
      @Override
      public EventDispatcher answer(InvocationOnMock invocation) throws Throwable {
        return mEventDispatcherMock;
      }
    });
    PowerMockito.when(mUIManagerMock.getConstants()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return MapBuilder.of("customDirectEventTypes", MapBuilder.newHashMap());
      }
    });
    PowerMockito.when(mUIManagerMock.getDirectEventNamesResolver())
      .thenAnswer(new Answer<UIManagerModule.CustomEventNamesResolver>() {
        @Override
        public UIManagerModule.CustomEventNamesResolver answer(InvocationOnMock invocation) throws Throwable {
          return new UIManagerModule.CustomEventNamesResolver() {
            @Override
            public String resolveCustomEventName(String eventName) {
              Map<String, Map> directEventTypes = (Map<String, Map>) mUIManagerMock.getConstants()
                .get("customDirectEventTypes");
              if (directEventTypes != null) {
                Map<String, String> customEventType = (Map<String, String>) directEventTypes.get(eventName);
                if (customEventType != null) {
                  return customEventType.get("registrationName");
                }
              }
              return eventName;
            }
          };
        }
      });
    mNativeAnimatedNodesManager = new NativeAnimatedNodesManager(mUIManagerMock, mReactApplicationContextMock);
  }

  private double evalExpression (ReadableMap expression) {
    mNativeAnimatedNodesManager
      .createAnimatedNode(1, JavaOnlyMap.of("type", "expression", "expression", expression));
    ExpressionAnimatedNode node = (ExpressionAnimatedNode)mNativeAnimatedNodesManager.getNodeById(1);
    node.update();
    return node.mValue;
  }

  private String evalStringExpression (ReadableMap expression) {
    mNativeAnimatedNodesManager
      .createAnimatedNode(1, JavaOnlyMap.of("type", "expression", "expression", expression));
    ExpressionAnimatedNode node = (ExpressionAnimatedNode)mNativeAnimatedNodesManager.getNodeById(1);
    node.update();
    return (String)node.mAnimatedObject;
  }

  private Boolean evalBooleanExpression (ReadableMap expression) {
    mNativeAnimatedNodesManager
      .createAnimatedNode(1, JavaOnlyMap.of("type", "expression", "expression", expression));
    ExpressionAnimatedNode node = (ExpressionAnimatedNode)mNativeAnimatedNodesManager.getNodeById(1);
    node.update();
    return (Boolean)node.mAnimatedObject;
  }

  private ReadableMap createNumber (double num) {
    return JavaOnlyMap.of("type", "number", "value", num);
  }

  private ReadableMap createExpr (Object... keysAndValues) {
    return JavaOnlyMap.of(keysAndValues);
  }

  private ReadableMap createSingleOp (String type, double v) {
    return createExpr("type", type, "v", createNumber(v));
  }

  @Test
  public void testReturnsNumber () {
    double valueToTest = evalExpression(createNumber(40));
    assertThat(valueToTest).isEqualTo(40);
  }

  @Test
  public void testNestedExpressions () {
    double valueToTest = evalExpression(
      createExpr("type", "add",
        "a", createExpr("type", "multiply",
          "a", createNumber(10),
          "b", createNumber(10),
          "args", JavaOnlyArray.of()),
        "b", createNumber(2),
        "args", JavaOnlyArray.of())
    );
    assertThat(valueToTest).isEqualTo(102);
  }

  @Test public void testBlockExpressions () {
    double valueToTest = evalExpression(
      createExpr("type", "block",
        "args", JavaOnlyArray.of(createNumber(20), createNumber(30)))
    );
    assertThat(valueToTest).isEqualTo(30);
  }

  @Test public void testConditionExpression () {
    double valueToTest = evalExpression(
      createExpr("type", "cond",
        "expr", createNumber(1),
        "ifNode", createNumber(100),
        "elseNode", createNumber(200)
        )
    );
    assertThat(valueToTest).isEqualTo(100);
  }

  @Test public void testSettingValues () {
    mNativeAnimatedNodesManager.createAnimatedNode(100, JavaOnlyMap.of(
      "type", "value", "value", 10, "offset", 0));
    ValueAnimatedNode node = (ValueAnimatedNode )mNativeAnimatedNodesManager.getNodeById(100);

    evalExpression(createExpr("type", "set",
      "target", 100,
      "source", createNumber(1))
    );
    assertThat(node.mValue).isEqualTo(1);
  }

  @Test
  public void testAddExpression () {
    double valueToTest = evalExpression(createExpr("type", "add",
      "a", createNumber(10),
      "b", createNumber(20),
      "args", JavaOnlyArray.of(createNumber(30), createNumber(40))));

    assertThat(valueToTest).isEqualTo(100);
  }

  @Test
  public void testSubExpression () {
    double valueToTest = evalExpression(createExpr("type", "sub",
      "a", createNumber(100),
      "b", createNumber(50),
      "args", JavaOnlyArray.of(createNumber(30), createNumber(10))));

    assertThat(valueToTest).isEqualTo(10);
  }

  @Test
  public void testMultiplyExpression () {
    double valueToTest = evalExpression(createExpr("type", "multiply",
      "a", createNumber(2),
      "b", createNumber(2),
      "args", JavaOnlyArray.of(createNumber(2), createNumber(2))));

    assertThat(valueToTest).isEqualTo(16);
  }

  @Test
  public void testDivideExpression () {
    double valueToTest = evalExpression(createExpr( "type", "divide",
      "a", createNumber(100),
      "b", createNumber(2),
      "args", JavaOnlyArray.of(createNumber(2), createNumber(5))));

    assertThat(valueToTest).isEqualTo(5);
  }

  @Test
  public void testPowerExpression () {
    double valueToTest = evalExpression(createExpr( "type", "pow",
      "a", createNumber(2),
      "b", createNumber(2),
      "args", JavaOnlyArray.of(createNumber(2))));

    assertThat(valueToTest).isEqualTo(16);
  }

  @Test
  public void testModuloExpression () {
    double valueToTest = evalExpression(createExpr( "type", "modulo",
      "a", createNumber(20),
      "b", createNumber(8),
      "args", JavaOnlyArray.of(createNumber(3))));

    assertThat(valueToTest).isEqualTo(1);
  }

  @Test
  public void testAbsExpression () {
    assertThat(evalExpression(createSingleOp("abs", -16))).isEqualTo(16);
  }

  @Test
  public void testSqrtExpression () {
    assertThat(evalExpression(createSingleOp("sqrt", 16))).isEqualTo(4);
  }

  @Test
  public void testLogExpression () {
    assertThat(evalExpression(createSingleOp("log", 16))).isEqualTo(Math.log(16));
  }

  @Test
  public void testSinExpression () {
    assertThat(evalExpression(createSingleOp("sin", 16))).isEqualTo(Math.sin(16));
  }

  @Test
  public void testCosExpression () {
    assertThat(evalExpression(createSingleOp("cos", 16))).isEqualTo(Math.cos(16));
  }

  @Test
  public void testTanExpression () {
    assertThat(evalExpression(createSingleOp("tan", 16))).isEqualTo(Math.tan(16));
  }

  @Test
  public void testAsinExpression () {
    assertThat(evalExpression(createSingleOp("asin", 16))).isEqualTo(Math.asin(16));
  }

  @Test
  public void testAcosExpression () {
    assertThat(evalExpression(createSingleOp("acos", 16))).isEqualTo(Math.acos(16));
  }

  @Test
  public void testAtanExpression () {
    assertThat(evalExpression(createSingleOp("atan", 16))).isEqualTo(Math.atan(16));
  }

  @Test
  public void testExpExpression () {
    assertThat(evalExpression(createSingleOp("exp", 16))).isEqualTo(Math.exp(16));
  }

  @Test
  public void testRoundExpression () {
    assertThat(evalExpression(createSingleOp("round", 25.5))).isEqualTo(Math.round(25.5));
  }

  @Test public void testAndExpressionReturnsTrue () {
    assertThat(evalExpression(createExpr("type", "and",
      "a", createNumber(1),
      "b", createNumber(1),
      "args", JavaOnlyArray.of(createNumber(1))))).isEqualTo(1);
  }

  @Test public void testAndExpressionReturnsFalse () {

    assertThat(evalExpression(createExpr("type", "and",
      "a", createNumber(1),
      "b", createNumber(0),
      "args", JavaOnlyArray.of(createNumber(1))))).isEqualTo(0);
  }

  @Test public void testOrExpressionReturnsTrue () {
    assertThat(evalExpression(createExpr("type", "or",
      "a", createNumber(0),
      "b", createNumber(0),
      "args", JavaOnlyArray.of(createNumber(1))))).isEqualTo(1);

  }

  @Test public void testOrExpressionReturnsFalse () {
    assertThat(evalExpression(createExpr("type", "or",
      "a", createNumber(0),
      "b", createNumber(0),
      "args", JavaOnlyArray.of(createNumber(0))))).isEqualTo(0);
  }

  @Test public void testNotExpressionReturnsTrue () {
    assertThat(evalExpression(createExpr("type", "not",
      "v", createNumber(0)))).isEqualTo(1);

  }

  @Test public void testNotExpressionReturnsFalse () {
    assertThat(evalExpression(createExpr("type", "not",
      "v", createNumber(1)))).isEqualTo(0);
  }

  @Test public void testEqReturnsTrue () {
    assertThat(evalExpression(createExpr("type", "eq",
      "left", createNumber(1),
      "right", createNumber(1)))).isEqualTo(1);
  }

  @Test public void testEqReturnsFalse () {
    assertThat(evalExpression(createExpr("type", "eq",
      "left", createNumber(100),
      "right", createNumber(1)))).isEqualTo(0);
  }

  @Test public void testNeqReturnsTrue () {
    assertThat(evalExpression(createExpr("type", "neq",
      "left", createNumber(0),
      "right", createNumber(1)))).isEqualTo(1);
  }

  @Test public void testNeqReturnsFalse () {
    assertThat(evalExpression(createExpr("type", "neq",
      "left", createNumber(1),
      "right", createNumber(1)))).isEqualTo(0);
  }

  @Test public void testLessThanReturnsTrue () {
    assertThat(evalExpression(createExpr("type", "lessThan",
      "left", createNumber(0),
      "right", createNumber(1)))).isEqualTo(1);
  }

  @Test public void testLessThanReturnsFalse () {
    assertThat(evalExpression(createExpr("type", "lessThan",
      "left", createNumber(1),
      "right", createNumber(0)))).isEqualTo(0);
  }

  @Test public void testGreaterThanReturnsTrue () {
    assertThat(evalExpression(createExpr("type", "greaterThan",
      "left", createNumber(1),
      "right", createNumber(0)))).isEqualTo(1);
  }

  @Test public void testGreaterThanReturnsFalse () {
    assertThat(evalExpression(createExpr("type", "greaterThan",
      "left", createNumber(0),
      "right", createNumber(1)))).isEqualTo(0);
  }

  @Test public void testGreaterOrEqReturnsTrueWhenEqual () {
    assertThat(evalExpression(createExpr("type", "greaterOrEq",
      "left", createNumber(10),
      "right", createNumber(10)))).isEqualTo(1);
  }

  @Test public void testGreaterOrEqReturnsTrueWhenGreater() {
    assertThat(evalExpression(createExpr("type", "greaterOrEq",
      "left", createNumber(100),
      "right", createNumber(10)))).isEqualTo(1);
  }

  @Test public void testGreaterOrEqReturnsFalse () {
    assertThat(evalExpression(createExpr("type", "greaterOrEq",
      "left", createNumber(10),
      "right", createNumber(100)))).isEqualTo(0);
  }

  @Test public void testLessOrEqReturnsTrueWhenEqual () {
    assertThat(evalExpression(createExpr("type", "lessOrEq",
      "left", createNumber(10),
      "right", createNumber(10)))).isEqualTo(1);
  }

  @Test public void testLessOrEqReturnsTrueWhenGreater() {
    assertThat(evalExpression(createExpr("type", "lessOrEq",
      "left", createNumber(10),
      "right", createNumber(100)))).isEqualTo(1);
  }

  @Test public void testLessOrEqReturnsFalse () {
    assertThat(evalExpression(createExpr("type", "lessOrEq",
      "left", createNumber(100),
      "right", createNumber(10)))).isEqualTo(0);
  }

  @Test public void testMaxReturnsMax () {
    assertThat(evalExpression(createExpr("type", "max",
      "a", createNumber(100),
      "b", createNumber(10),
      "args", JavaOnlyArray.of(createNumber(1))))).isEqualTo(100);
  }

  @Test public void testMinReturnsMin () {
    assertThat(evalExpression(createExpr("type", "min",
      "a", createNumber(100),
      "b", createNumber(10),
      "args", JavaOnlyArray.of(createNumber(50))))).isEqualTo(10);
  }

  @Test public void testCeilReturnsCeil () {
    assertThat(evalExpression(createExpr("type", "ceil",
      "v", createNumber(10.1)))).isEqualTo(11);
  }

  @Test public void testFloorReturnsFloor () {
    assertThat(evalExpression(createExpr("type", "floor",
      "v", createNumber(10.9)))).isEqualTo(10);
  }

  @Test public void testFormat () {
    assertThat(evalStringExpression(createExpr("type", "format",
      "format", "val: %.0f",
      "args", JavaOnlyArray.of(createNumber(10.12345678))))).isEqualTo("val: 10");
  }

  @Test public void testBooleanReturnsTrue () {
    assertThat(evalBooleanExpression(createExpr("type", "castBoolean",
      "v", createNumber(10)))).isTrue();
  }

  @Test public void testBooleanReturnsFalse() {
    assertThat(evalBooleanExpression(createExpr("type", "castBoolean",
      "v", createNumber(0)))).isFalse();
  }
}
