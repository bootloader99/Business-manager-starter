# Customization Guide

Use this guide to rebrand the template before distributing a customized app. Keep a source-control commit or backup before changing native files. Native resource changes require a new native build; refreshing Metro alone is not sufficient.

## 1. Change the app display name

Update the display name for each platform:

| Purpose | File | Setting |
| --- | --- | --- |
| React Native component registration | `app.json` (`name`) and `android/app/src/main/java/com/businessmanager/MainActivity.kt` (`getMainComponentName()`) | Keep both names aligned. `displayName` is not a replacement for the native launcher label. |
| Android launcher label | `android/app/src/main/res/values/strings.xml` | `app_name` |
| iOS launcher label | `ios/BusinessManager/Info.plist` | `CFBundleDisplayName` |

Example Android string:

```xml
<string name="app_name">Acme Manager</string>
```

Example iOS property:

```xml
<key>CFBundleDisplayName</key>
<string>Acme Manager</string>
```

Keep labels consistent. The JavaScript registration name and the installed app's display label serve different purposes.

## 2. Change brand defaults, colors, and formatting

The defaults are centralized in `src/config/appConfig.ts`. Edit the relevant properties in the existing exported object. Its current shape is:

```ts
export const appConfig = {
  branding: {
    appName: 'Business Manager',
    companyName: 'Northstar Studio',
  },
  theme: {
    brand: '#183D32',
    primary: '#183D32',
    primaryDark: '#112D25',
    primaryLight: '#DCE6D9',
  },
  formatting: {
    currencyCode: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    dateFormat: 'DD/MM/YYYY',
  },
} as const;
```

Replace the example values with your intended defaults. Also review the Business Profile and invoice settings screens: values entered by the app user are stored in SQLite and may differ from source defaults.

- `src/theme/colors.ts` — light and dark color palettes.
- `src/theme/typography.ts` — text styles and font families.
- `src/theme/ThemeProvider.tsx` — loads/saves the Light, Dark, or System preference.

Changing the currency symbol or locale changes formatting only. It does not convert stored amounts or perform foreign-exchange calculations.

## 3. Change UI strings

Most visible labels and messages live beside the screen or component that renders them. To change a label such as “Customers”:

1. Use your editor's global search to find the exact text across `src/`.
2. Open the matching file under `src/screens/` or `src/components/`.
3. Edit the string literal passed to the relevant `Text` element or shared component.
4. Search again for the old wording and update other occurrences that should change too.
5. Run the app and check the screen, empty state, validation message, and confirmation dialog as applicable.

For example, if the source contains:

```tsx
<Text>Customers</Text>
```

you could change it to:

```tsx
<Text>Clients</Text>
```

This is an illustrative example; locate the actual occurrence in the current source before editing. The project does not provide a complete localization framework. Multi-language support requires a localization solution rather than changing one string in a central config file.

## 4. Change the iOS launch screen

The native iOS launch screen is `ios/BusinessManager/LaunchScreen.storyboard`. The current storyboard contains the labels `BusinessManager` and `Powered by React Native` and a system background.

1. Open `ios/BusinessManager.xcworkspace` in Xcode.
2. In the Project navigator, open `ios/BusinessManager/LaunchScreen.storyboard`.
3. Select the label to change and edit its **Text** value in the Attributes inspector.
4. Select the root view to change its background. For a consistent brand color, create/select a color asset and apply it here.
5. To add a logo, add the image to `ios/BusinessManager/Images.xcassets`, add an image view to the storyboard, and apply Auto Layout constraints so it works on different screen sizes.
6. Keep the launch screen static; do not add custom runtime logic or timers to the launch storyboard.
7. Save and rebuild the native app, then inspect the launch screen on a simulator or device.

The launcher label is separate: change `CFBundleDisplayName` in `ios/BusinessManager/Info.plist` as described above. Editing that key does not change storyboard labels automatically.

## 5. Customize Android's launch experience

The Android application theme is in `android/app/src/main/res/values/styles.xml` and is referenced by `android/app/src/main/AndroidManifest.xml` as `@style/AppTheme`. The manifest references launcher icons through `@mipmap/ic_launcher` and `@mipmap/ic_launcher_round`.

The current `res/drawable` directory does not contain a separate branded splash layout/drawable. Changing `strings.xml` changes the app label; it does not create a custom splash screen.

To add a branded Android splash screen:

1. Decide which Android versions you support. Android 12 (API 31) and later provide the platform SplashScreen API.
2. Follow the [official Android SplashScreen documentation](https://developer.android.com/develop/ui/views/launch/splash-screen). Use the platform API or an AndroidX compatibility library if your chosen implementation needs it; do not add a dependency automatically without checking the project's current setup.
3. Configure the starting theme in `android/app/src/main/res/values/styles.xml`. Add version-specific resources such as `values-v31` only if the implementation requires them.
4. Provide the appropriate splash icon/artwork and background resources for the chosen API. Android 12+ displays a system-controlled splash screen with centered icon/branding rather than an unrestricted full-screen image. Keep splash assets distinct from launcher-icon assets where their design or sizing differs.
5. Confirm `AndroidManifest.xml` applies the intended starting theme. Add `MainActivity` initialization only if the selected library/API version requires it.
6. Rebuild and test on an Android 12+ emulator/device and an older Android version within your supported range.

Do not paste a splash-screen snippet intended for a different React Native or AndroidX version without verifying dependencies and initialization. The current template does not ship a separate custom Android splash implementation.

## 6. Replace launcher icons

The source icon is `src/assets/appIcon/BusinessManager.png`.

- Android: `android/app/src/main/res/mipmap-*/` and `mipmap-anydpi-v26/`.
- iOS: `ios/BusinessManager/Images.xcassets/AppIcon.appiconset/`.

Replace the source artwork and native platform assets consistently. Updating the source PNG alone does not regenerate all native icons.

The current repository does not include an app-icon regeneration script. Replacing `src/assets/appIcon/BusinessManager.png` alone does not regenerate the Android or iOS icon sets. Use a suitable icon-generation tool or update the platform assets manually, then inspect the generated Android mipmap/adaptive-icon resources and the iOS `AppIcon.appiconset` before rebuilding. Keep a source-control commit or a separate backup before overwriting native assets.

## 7. Change application identifiers

### Android

Edit `namespace` and `applicationId` in `android/app/build.gradle`. If the namespace changes, inspect Java/Kotlin package declarations and native references for the old package. Rebuild after changing identifiers.

### iOS

Open `ios/BusinessManager.xcworkspace` in Xcode, select the **BusinessManager** target, and open **Build Settings**. Search for **Product Bundle Identifier** (`PRODUCT_BUNDLE_IDENTIFIER`) and set a unique identifier you control for Debug and Release. Then open **Signing & Capabilities**, choose your Apple development team, and configure signing for device builds and archives.

Changing identifiers creates a distinct app identity and affects signing, provisioning, app data, and store listings. Choose the final identifier before publishing.

## 8. Fonts and icons

Font source files are in `src/assets/fonts/`; Android native font assets are under `android/app/src/main/assets/fonts/`. iOS font registrations are in `ios/BusinessManager/Info.plist` under `UIAppFonts`.

When replacing a font, keep filenames and family names consistent with `src/theme/typography.ts`, update native assets/registrations, and rebuild. Check the licenses of replacement fonts and icons before redistributing them; see [Third-party notices](../THIRD_PARTY_NOTICES.md).

## 9. Business details and invoice PDF

The Business Profile and invoice settings screens save editable details in local SQLite. Invoice PDF layout is implemented in `src/services/pdf/invoicePdfService.ts`. Review the related repositories and formatting utilities before changing totals, tax, currency, dates, or invoice layout.

For persistent database schema changes, add a forward migration under `src/database/migrations/`; existing installations do not automatically receive schema changes made only to an old migration.

## 10. Rebuild and verify

After changing native identifiers, icons, fonts, resources, or launch-screen files, rebuild the app. See [Installation](INSTALLATION.md) for Android builds and the complete iOS signing/archive/export procedure. Verify branding on a clean install for every platform you plan to distribute.
