# Installation and Build Guide

This project uses React Native CLI, TypeScript, and local SQLite storage. Use the platform-specific instructions below. iOS builds, signing, and archives require macOS and Xcode.

## Requirements

- Node.js `>=22.11.0` as declared in `package.json`, plus npm.
- Android: Android Studio, the SDK/build-tools versions declared in `android/build.gradle`, a compatible JDK, and an emulator or USB-debugging-enabled device.
- iOS: a Mac, compatible Xcode, Xcode Command Line Tools, Ruby/Bundler, and CocoaPods.
- Git is recommended for tracking customizations.

The Android configuration declares compile SDK 37, target SDK 36, minimum SDK 24, build tools 37.0.0, NDK 28.0.12433566, and Gradle wrapper 9.4.1. Install the versions requested by the project through Android Studio SDK Manager. Check the Gradle/Android Gradle Plugin documentation for the JDK compatible with the versions resolved by this project. The Xcode project currently sets an iOS deployment target of 15.1; verify React Native 0.87 requirements against your installed Xcode.

## 1. Install JavaScript dependencies

Run from the repository root:

```sh
npm ci
```

This installs the dependency tree recorded in `package-lock.json`. It recreates `node_modules`; do not use it if you need to preserve local changes inside that directory.

## 2. Android setup and run

1. Install Android Studio and open SDK Manager.
2. Install the SDK platform/build tools and NDK versions required by `android/build.gradle`.
3. Configure `ANDROID_HOME` to your Android SDK directory and add `platform-tools` to PATH if needed.
4. Start an emulator or connect a device with Developer Options and USB debugging enabled.
5. Check that the device is detected:

```powershell
adb devices
node --version
npm --version
java -version
$env:ANDROID_HOME
```

Open two terminals at the repository root. In terminal 1:

```powershell
npm start
```

In terminal 2:

```powershell
npm run android
```

The second command runs `react-native run-android` and installs/launches the debug app.

### Build a debug APK

From the repository root in Windows PowerShell:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Expected artifact: `android/app/build/outputs/apk/debug/app-debug.apk`, relative to the repository root.

### Build a signed Android release

Release builds require your own keystore and all four environment variables. The release configuration deliberately does not fall back to debug signing.

1. Create a keystore (or use one you control). Example for a PKCS#12 keystore:

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore "$env:USERPROFILE\business-manager-release.p12" -alias business-manager -keyalg RSA -keysize 2048 -validity 10000
```

2. Set these variables in the same PowerShell session used to run Gradle. Replace the example passwords and never commit credentials:

```powershell
$env:ANDROID_RELEASE_STORE_FILE = "$env:USERPROFILE\business-manager-release.p12"
$env:ANDROID_RELEASE_STORE_PASSWORD = "your-keystore-password"
$env:ANDROID_RELEASE_KEY_ALIAS = "business-manager"
$env:ANDROID_RELEASE_KEY_PASSWORD = "your-key-password"
```

3. From the repository root, run the desired task:

```powershell
cd android
.\gradlew.bat assembleRelease
# Or for Google Play upload:
.\gradlew.bat bundleRelease
```

Expected output folders are `android/app/build/outputs/apk/release/` and `android/app/build/outputs/bundle/release/`. Keep the keystore and passwords private and securely backed up. Updates generally require the same signing identity. Do not put signing credentials in source control or the marketplace ZIP.

4. Clear the environment variables when finished:

```powershell
Remove-Item Env:ANDROID_RELEASE_STORE_FILE, Env:ANDROID_RELEASE_STORE_PASSWORD, Env:ANDROID_RELEASE_KEY_ALIAS, Env:ANDROID_RELEASE_KEY_PASSWORD
```

These are the configured Gradle tasks; successful signing depends on your local toolchain and valid credentials. Test the output artifact before distributing it.

## 3. iOS setup and run (macOS only)

### Install Xcode, Ruby dependencies, and CocoaPods

1. Install Xcode, launch it once, and complete its initial setup.
2. Select the intended Xcode Command Line Tools version in Xcode Settings/Preferences → Locations. Check the installation:

```sh
xcode-select -p
xcodebuild -version
```

3. Install a Ruby version compatible with the repository's root `Gemfile`. From the repository root, install the Ruby dependencies declared by the `Gemfile`:

```sh
bundle install
```

4. Install CocoaPods dependencies:

```sh
cd ios
bundle exec pod install
cd ..
```

Use Bundler so the Ruby dependencies specified for this project are used. Let `pod install` finish successfully before opening Xcode.

### Open the workspace and run

Open the CocoaPods-integrated workspace, **not** the project file:

```sh
open ios/BusinessManager.xcworkspace
```

In Xcode, select the **BusinessManager** scheme and an iOS Simulator, then choose **Product → Run**. You can also choose **Product → Build** to build without launching. The workspace is required for CocoaPods integration; opening `BusinessManager.xcodeproj` directly can result in missing module/framework errors.

### Configure signing and provisioning

1. In Xcode's Project navigator, select the **BusinessManager** project and then its **BusinessManager** target.
2. Under **Build Settings**, search for **Product Bundle Identifier** (`PRODUCT_BUNDLE_IDENTIFIER`). Set a unique identifier you control for Debug and Release.
3. Open **Signing & Capabilities**, enable **Automatically manage signing** where appropriate, and select your Apple Developer team.
4. For a physical device, connect and trust the device, select it as the run destination, and register it with your developer account if Xcode requires it. Resolve certificate and provisioning-profile errors shown by Xcode.
5. Confirm the selected team, bundle ID, signing identity, and profile are correct before archiving.

Apple account capabilities and distribution requirements can change. A free Apple account is not a substitute for the Apple Developer Program and distribution provisioning required for App Store release; check Apple's current requirements.

### Archive and export an iOS app

1. Open `ios/BusinessManager.xcworkspace`.
2. Select the **BusinessManager** scheme.
3. Set the run destination to **Any iOS Device (arm64)** or the generic iOS device destination offered by your Xcode version. Do not select a simulator for an App Store archive.
4. Verify the Release configuration, bundle identifier, team, and signing settings.
5. Choose **Product → Archive** and wait for the archive to complete.
6. In Xcode Organizer, select the archive and choose **Distribute App**.
7. Choose the intended distribution method, such as **App Store Connect** for TestFlight/App Store submission, **Ad Hoc** for eligible registered devices, or **Development** for development-signed devices. Enterprise distribution is only for organizations that qualify for Apple's program.
8. Follow the signing/export prompts, select the correct team and provisioning profile, then export the build or complete the App Store Connect upload.
9. Test the exported build on an appropriate device and keep archives and signing credentials secure.

Xcode's options can vary by version and distribution type; follow its current prompts and Apple's requirements. Creating an archive does not mean Apple has approved the app. Test the app on the intended devices, configure signing and provisioning, create and export the distribution archive, and verify the resulting package in your Mac/Xcode environment before publishing.

## 4. Basic usage

See [Basic Usage](USAGE.md) for the first-run workflow, the main screens, invoice PDFs, and data backup/import.

## 5. Troubleshooting

- **Android device not detected:** start the emulator or enable USB debugging, then run `adb devices`.
- **Android SDK/JDK errors:** verify SDK, NDK, and JDK versions against the project configuration and Gradle output.
- **iOS missing modules/frameworks:** open `ios/BusinessManager.xcworkspace`, not the `.xcodeproj`, and run `bundle exec pod install` from `ios/`.
- **iOS signing errors:** verify the bundle identifier, selected team, device registration, certificate, and provisioning profile.
- **Android release signing errors:** ensure all four `ANDROID_RELEASE_*` variables are set in the same terminal and that the keystore path exists.

See [Troubleshooting](TROUBLESHOOTING.md) for additional guidance.
