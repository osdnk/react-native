//
//  REAJsiModule.hpp
//  RNReanimated
//
//  Created by Christian Falch on 24/04/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//
#import <jsi/jsi.h>

using namespace facebook;

@class RCTNativeAnimatedModule;

class JSI_EXPORT RCTNatieAnimatedModuleBindings : public jsi::HostObject {
public:
    RCTNatieAnimatedModuleBindings(RCTNativeAnimatedModule* module);
    
    static void install(RCTNativeAnimatedModule *module);
    
    /*
     * `jsi::HostObject` specific overloads.
     */
    jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override;
    
private:
    RCTNativeAnimatedModule* _module;
};
