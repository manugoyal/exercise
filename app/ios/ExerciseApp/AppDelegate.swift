import UIKit
import React_RCTAppDelegate
import React

@main
class AppDelegate: RCTAppDelegate {

  // If you manage UIWindow yourself, disable RN’s auto-window
  // self.automaticallyLoadReactNativeWindow = false

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
  ) -> Bool {
    self.moduleName = "ExerciseApp"
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Old-architecture hook
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return bundleURL()
  }

  // **New-architecture requirement**
  override func bundleURL() -> URL? {
#if DEBUG
    // Expo prebuild uses a virtual entry point – keep it if you rely on Expo
    return RCTBundleURLProvider.sharedSettings()
      .jsBundleURL(forBundleRoot: "index") // or "index" if not using Expo
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

