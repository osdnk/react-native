//
//  REAJsiModule.cpp
//  RNReanimated
//
//  Created by Christian Falch on 24/04/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//


#include "RCTNativeAnimatedModuleBindings.h"
#import <React/RCTBridge+Private.h>
#import "RCTNativeAnimatedModule.h"
#import "RCTJSIUtilities.h"

struct EventHandlerWrapper {
    EventHandlerWrapper(jsi::Function eventHandler)
    : callback(std::move(eventHandler)) {}
    
    jsi::Function callback;
};

RCTNativeAnimatedModuleBindings::RCTNativeAnimatedModuleBindings(RCTNativeAnimatedModule* module)
: _module(module) {}

void RCTNativeAnimatedModuleBindings::install(RCTNativeAnimatedModule *module) {
    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)module.bridge;
    if (cxxBridge.runtime == nullptr) {
        return;
    }
    
    jsi::Runtime &runtime = *(jsi::Runtime *)cxxBridge.runtime;
    auto rctModuleName = "NativeAnimated";
    
    auto rctJsiModule = std::make_shared<RCTNativeAnimatedModuleBindings>(std::move(module));
    auto object = jsi::Object::createFromHostObject(runtime, rctJsiModule);
    runtime.global().setProperty(runtime, rctModuleName, std::move(object));
}

jsi::Value RCTNativeAnimatedModuleBindings::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
    auto methodName = name.utf8(runtime);
    if (methodName == "createNode") {
        RCTNativeAnimatedModule* module = _module;
      return jsi::Function::createFromHostFunction(runtime, name, 2, [module](
               jsi::Runtime &runtime,
               const jsi::Value &thisValue,
               const jsi::Value *arguments,
               size_t count) -> jsi::Value {
            
            auto arg1 = &arguments[0];
            auto arg2 = &arguments[1];
            auto config = convertJSIObjectToNSDictionary(runtime, arg2->asObject(runtime));
        [module createAnimatedNode:arg1->asNumber() config:(NSDictionary<NSString *, id>*)config];
            return jsi::Value::undefined();
        });
    }
    if (methodName == "dropNode") {
      RCTNativeAnimatedModule* module = _module;
        return jsi::Function::createFromHostFunction(runtime, name, 1, [module](
                                                                                   jsi::Runtime &runtime,
                                                                                   const jsi::Value &thisValue,
                                                                                   const jsi::Value *arguments,
                                                                                   size_t count) -> jsi::Value {
            
            auto arg1 = &arguments[0];
            [module dropAnimatedNode:arg1->asNumber()];
            return jsi::Value::undefined();
        });
    }
    if (methodName == "connectNodes") {
        RCTNativeAnimatedModule* reamodule = _module;
        return jsi::Function::createFromHostFunction(runtime, name, 2, [reamodule](
               jsi::Runtime &runtime,
               const jsi::Value &thisValue,
               const jsi::Value *arguments,
               size_t count) -> jsi::Value {
            
            auto arg1 = &arguments[0];
            auto arg2 = &arguments[1];
            [reamodule connectAnimatedNodes:arg1->asNumber() childTag:arg2->asNumber()];
            
            return jsi::Value::undefined();
        });
    }
    if (methodName == "disconnectNodes") {
        RCTNativeAnimatedModule* reamodule = _module;
        return jsi::Function::createFromHostFunction(runtime, name, 2, [reamodule](
                                                                                   jsi::Runtime &runtime,
                                                                                   const jsi::Value &thisValue,
                                                                                   const jsi::Value *arguments,
                                                                                   size_t count) -> jsi::Value {
            
            auto arg1 = &arguments[0];
            auto arg2 = &arguments[1];
            [reamodule disconnectAnimatedNodes:arg1->asNumber() childTag:arg2->asNumber()];
            
            return jsi::Value::undefined();
        });
    }
    if (methodName == "connectNodeToView") {
        RCTNativeAnimatedModule* reamodule = _module;
        return jsi::Function::createFromHostFunction(runtime, name, 2, [reamodule](
                                                                                   jsi::Runtime &runtime,
                                                                                   const jsi::Value &thisValue,
                                                                                   const jsi::Value *arguments,
                                                                                   size_t count) -> jsi::Value {
            
            auto arg1 = &arguments[0];
            auto arg2 = &arguments[1];
            [reamodule connectAnimatedNodeToView:arg1->asNumber() viewTag:arg2->asNumber()];
            
            return jsi::Value::undefined();
        });
    }
    if (methodName == "disconnectNodeFromView") {
        RCTNativeAnimatedModule* reamodule = _module;
        return jsi::Function::createFromHostFunction(runtime, name, 2, [reamodule](
                                                                                   jsi::Runtime &runtime,
                                                                                   const jsi::Value &thisValue,
                                                                                   const jsi::Value *arguments,
                                                                                   size_t count) -> jsi::Value {
            
            auto arg1 = &arguments[0];
            auto arg2 = &arguments[1];
            [reamodule disconnectAnimatedNodeFromView:arg1->asNumber() viewTag:arg2->asNumber()];
            
            return jsi::Value::undefined();
        });
    }
    /*if (methodName == "getValue") {
        RCTNativeAnimatedModule* reamodule = _module;
        return jsi::Function::createFromHostFunction(runtime, name, 2, [reamodule](
                                                                                   jsi::Runtime &runtime,
                                                                                   const jsi::Value &thisValue,
                                                                                   const jsi::Value *arguments,
                                                                                   size_t count) -> jsi::Value {
            
            auto arg1 = &arguments[0];
            auto arg2 =  &arguments[1];
            jsi::Function cb = arg2->getObject(runtime).asFunction(runtime);
            auto eventhandler = std::make_shared<EventHandlerWrapper>(std::move(cb));
            
            [reamodule getValue:[NSNumber numberWithDouble:arg1->asNumber()] callback:^(NSArray *response) {
            
                auto &eventHandlerWrapper = static_cast<const EventHandlerWrapper &>(*eventhandler);
                
                id value = response[0];
                if ([value isKindOfClass:[NSString class]]) {
                    eventHandlerWrapper.callback.call(runtime, jsi::String::createFromUtf8(runtime, [value UTF8String] ?: ""));
                } else if([value isKindOfClass:[NSNumber class]]) {
                    eventHandlerWrapper.callback.call(runtime, jsi::Value([value doubleValue]));
                } else if([value isEqual:[NSNull null]]) {
                    eventHandlerWrapper.callback.call(runtime, jsi::Value::undefined());
                } else {
                    NSLog(@"ERROR! %@", value);
                }
            }];
            return jsi::Value::undefined();
        });
    }*/
    
    
    return jsi::Value::undefined();
}
