# Third-Party Notices

This project includes third-party libraries, fonts, and icon artwork. Each component remains subject to its own applicable license terms. The license texts and references below help identify the relevant terms when adapting and distributing the project.

## Project license

The root [LICENSE](LICENSE) is the custom source-available license for the original Business Manager Starter materials owned by the project author. It permits personal and commercial use, modification, and use in applications developed for yourself or clients, subject to restrictions on redistributing the Starter as a standalone or competing reusable template.

This project license does not replace or restrict the separate licenses that apply to third-party components. Where a third-party license grants rights that cannot be restricted by the project license, that third-party license governs those components.

## Direct npm dependencies

The committed `package.json` and `package-lock.json` identify the direct production dependencies and their resolved versions. The lockfile records MIT license metadata for the direct production dependencies listed in [the third-party license inventory](docs/THIRD_PARTY_LICENSE_INVENTORY.md). Packages and native dependencies may have their own license texts, notices, and attribution requirements; retain applicable upstream notices when distributing them.

## Font files

The repository includes copies of Inter, Noto Sans, and Poppins font files under `src/assets/fonts/` and `android/app/src/main/assets/fonts/`. The iOS project registers font files through `ios/BusinessManager/Info.plist`.

| Family | License and source | Included license text |
|---|---|---|
| Inter | [Google Fonts upstream OFL](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt); Inter Project Authors | [Inter OFL 1.1](docs/licenses/Inter-OFL-1.1.txt) |
| Noto Sans | [Google Fonts upstream OFL](https://github.com/google/fonts/blob/main/ofl/notosans/OFL.txt); Noto Sans Project Authors | [Noto Sans OFL 1.1](docs/licenses/NotoSans-OFL-1.1.txt) |
| Poppins | [Google Fonts upstream OFL](https://github.com/google/fonts/blob/main/ofl/poppins/OFL.txt); Poppins Project Authors | [Poppins OFL 1.1](docs/licenses/Poppins-OFL-1.1.txt) |

The SIL Open Font License permits bundling and redistribution with software subject to its terms, including preservation of required notices and restrictions on selling the font software by itself. The project license does not replace the OFL.

## Icons

The project imports `MaterialDesignIcons` from `@react-native-vector-icons/material-design-icons/static`; the npm package lock resolves version `13.1.4`.

- The icon-library code's declared npm license is MIT. See [React Native Vector Icons MIT license](docs/licenses/React-Native-Vector-Icons-MIT.txt).
- The Material Design Icons/Pictogrammers glyph set has its own upstream license. See the [Pictogrammers Material Design Icons license](https://github.com/Templarian/MaterialDesign/blob/master/LICENSE), the included [Pictogrammers license text](docs/licenses/MaterialDesignIcons-Pictogrammers-License.txt), and [Apache 2.0 text](docs/licenses/Apache-2.0.txt).

The library wrapper and the glyph artwork are distinct components and should be considered under their respective license terms.

## App icon and other artwork

The repository contains:
- Source artwork at `src/assets/appIcon/BusinessManager.png`.
- Android launcher images and adaptive-icon resources under `android/app/src/main/res/`.
- iOS launcher images under `ios/BusinessManager/Images.xcassets/AppIcon.appiconset/`.
- README/gallery screenshots under `docs/assets/screenshots/`.

The source app icon artwork was generated for this project using OpenAI image generation. The Android launcher resources and iOS AppIcon catalog are platform-specific variants generated from that source artwork. The gallery screenshots were captured from Business Manager running in an Android emulator and use synthetic demo contact data.

## Native dependency configuration

Android build plugins are declared in `android/build.gradle`; app dependencies are configured in `android/app/build.gradle` and React Native autolinking in `android/settings.gradle`. iOS native dependencies are resolved through `ios/Podfile`. Native dependency components retain their own applicable license and notice terms.

## Related documentation

See the [third-party license inventory](docs/THIRD_PARTY_LICENSE_INVENTORY.md) for a concise component and asset reference, and [LICENSE](LICENSE) for the project license.
