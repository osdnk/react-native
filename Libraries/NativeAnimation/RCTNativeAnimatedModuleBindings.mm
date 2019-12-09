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
    if (methodName == "createAnimatedNode") {
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
    if (methodName == "dropAnimatedNode") {
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
    if (methodName == "connectAnimatedNodes") {
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
    if (methodName == "disconnectAnimatedNodes") {
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
    if (methodName == "connectAnimatedNodeToView") {
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
    if (methodName == "disconnectAnimatedNodeFromView") {
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
    if (methodName == "addAnimatedEventToView") {
      RCTNativeAnimatedModule* reamodule = _module;
      return jsi::Function::createFromHostFunction(runtime, name, 3, [reamodule](
                                                                                 jsi::Runtime &runtime,
                                                                                 const jsi::Value &thisValue,
                                                                                 const jsi::Value *arguments,
                                                                                 size_t count) -> jsi::Value {
          
          auto arg1 = &arguments[0];
          auto arg2 = &arguments[1];
          auto arg3 = &arguments[2];
          auto eventMapping = convertJSIObjectToNSDictionary(runtime, arg3->asObject(runtime));
          NSString* arg2Str = convertJSIStringToNSString(runtime, arg2->asString(runtime));
          [reamodule addAnimatedEventToView:arg1->asNumber() eventName:arg2Str eventMapping:eventMapping];
          return jsi::Value::undefined();
      });
    }
  
    if(methodName == "removeAnimatedEventFromView") {
      RCTNativeAnimatedModule* reamodule = _module;
         return jsi::Function::createFromHostFunction(runtime, name, 3, [reamodule](
                                                                                    jsi::Runtime &runtime,
                                                                                    const jsi::Value &thisValue,
                                                                                    const jsi::Value *arguments,
                                                                                    size_t count) -> jsi::Value {
             
             auto arg1 = &arguments[0];
             auto arg2 = &arguments[1];
             auto arg3 = &arguments[2];
             NSString* arg2Str = convertJSIStringToNSString(runtime, arg2->asString(runtime));
             [reamodule removeAnimatedEventFromView:arg1->asNumber() eventName:arg2Str animatedNodeTag:arg3->asNumber()];
             return jsi::Value::undefined();
         });
    }
  
  if(methodName == "startAnimatingNode") {
    RCTNativeAnimatedModule* reamodule = _module;
       return jsi::Function::createFromHostFunction(runtime, name, 4, [reamodule](
                                                                                  jsi::Runtime &runtime,
                                                                                  const jsi::Value &thisValue,
                                                                                  const jsi::Value *arguments,
                                                                                  size_t count) -> jsi::Value {
           
           auto arg1 = &arguments[0];
           auto arg2 = &arguments[1];
           auto arg3 = &arguments[2];
           auto arg4 = &arguments[3];
         
           auto config = convertJSIObjectToNSDictionary(runtime, arg3->asObject(runtime));
           jsi::Function cb = arg4->getObject(runtime).asFunction(runtime);
           auto eventhandler = std::make_shared<EventHandlerWrapper>(std::move(cb));
         
          [reamodule startAnimatingNode:arg1->asNumber() nodeTag:arg2->asNumber() config:config endCallback:^(NSArray *response) {
            auto &eventHandlerWrapper = static_cast<const EventHandlerWrapper &>(*eventhandler);
            id value = response[0];
            eventHandlerWrapper.callback.call(runtime, convertNSDictionaryToJSIObject(runtime, (NSDictionary*)value));
          }];
           return jsi::Value::undefined();
       });
  }
  
  if(methodName == "stopAnimation") {
    RCTNativeAnimatedModule* reamodule = _module;
       return jsi::Function::createFromHostFunction(runtime, name, 4, [reamodule](
                                                                                  jsi::Runtime &runtime,
                                                                                  const jsi::Value &thisValue,
                                                                                  const jsi::Value *arguments,
                                                                                  size_t count) -> jsi::Value {
           
           auto arg1 = &arguments[0];
           [reamodule stopAnimation:arg1->asNumber()];
           return jsi::Value::undefined();
       });
  }
  
    if (methodName == "restoreDefaultValues") { }
      
    return jsi::Value::undefined();
}
