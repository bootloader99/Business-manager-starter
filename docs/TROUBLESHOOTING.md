# Troubleshooting

This guide provides practical diagnostics for environment-dependent setup, native builds, assets, and runtime issues. The remedies below are diagnostic guidance and may need to be adapted to the buyer's environment.

## Dependency installation

**Check:** Node.js version.

The repository declares `"node": ">=22.11.0"` in `package.json`. Check your installed version in PowerShell:

```powershell
node --version
npm --version
```

Use a compatible Node version before installing dependencies. For a clean dependency install from the committed lockfile, use `npm ci` from the repository root. It recreates `node_modules`, so do not use it to preserve local edits inside that directory.

## Android device not detected

Check that an emulator is running or a USB-debugging-enabled device is connected. From PowerShell:

```powershell
adb devices
```

If `adb` is not recognized, verify Android SDK Platform-Tools installation and PATH configuration. If the device is listed as unauthorized, accept the debugging prompt on the device.

## Android build fails

Collect the complete Gradle error before changing dependencies. Check the configured versions in:

- `android/gradle/wrapper/gradle-wrapper.properties`
- `android/build.gradle`
- `android/app/build.gradle`

Before changing dependencies, collect `java -version`, `where.exe java`, `adb version`, and `cd android; .\gradlew.bat --version`. Confirm that Android Studio's SDK Manager has the configured compile SDK/build tools installed and that `ANDROID_HOME` points to the intended SDK. If Gradle fails, retain the first error and the full task output; do not upgrade Gradle, the Android Gradle Plugin, React Native, or native packages as an unverified first response.

## Metro or React Native CLI errors

Start Metro from the repository root:

```powershell
npm start
```

Then run the Android script in a second terminal:

```powershell
npm run android
```

The script names are confirmed in `package.json`. On a new development machine, follow the installation guide to configure the required Node.js, Java, Android SDK, and native build tools before running them.

## Native assets or font changes

If a font or launcher icon does not update, confirm that the asset is present in the native platform resource location and that the font family/filename registration matches `src/theme/typography.ts` and `ios/BusinessManager/Info.plist`. Rebuild the native app after changing native assets; restarting Metro alone may not refresh native resources.

## PDF font or rendering problems

PDF generation is implemented in `src/services/pdf/invoicePdfService.ts` and uses bundled font data. Inspect the actual generated PDF and device logs before changing font embedding, layout, or pagination. Check that the bundled font files and `src/services/pdf/pdfFonts.ts` are present and that PDF generation reports a file path before investigating sharing/opening behavior.

## Metro cache or stale JavaScript bundle

If Metro appears to serve stale JavaScript, stop the Metro process and restart it from the repository root with `npm start -- --reset-cache`. This clears Metro's transform cache, not the app's SQLite database.

## Backup import or export errors

The file flow is implemented in `src/utils/backupFile.ts` and `src/database/repositories/dataBackupRepository.ts`. Confirm that the selected file is a valid Business Manager JSON backup and preserve an exported backup before importing, because import replaces current business data.

## iOS

If an issue occurs in a buyer's environment, reproduce it in Xcode and capture the first meaningful build/runtime error before changing native dependencies. A simulator build alone does not establish physical-device compatibility, signing/provisioning for distribution, or a successful App Store archive/export.

- **Missing modules or frameworks:** run `bundle exec pod install` from `ios/`, then open `ios/BusinessManager.xcworkspace` rather than the `.xcodeproj`.
- **Simulator build works but device build fails:** check the selected destination, signing team, bundle identifier, provisioning profile, and device registration.
- **Stale native resources:** rebuild after changing fonts, icons, launch-screen resources, or other native files; restarting Metro alone is not enough.
