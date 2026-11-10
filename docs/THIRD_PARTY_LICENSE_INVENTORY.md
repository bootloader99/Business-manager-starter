# Third-Party License Inventory

This guide identifies key third-party components and bundled assets, their license references, and the license texts included with the project. The applicable upstream license terms govern each third-party component; the project's [source-available license](../LICENSE) does not replace or restrict those terms.

## Direct runtime dependencies

| Component | Locked version | Use | License reference |
|---|---:|---|---|
| React Native / React | React Native `0.87.1`; React `19.2.3` | App framework and UI runtime | MIT; see each project's upstream license and notices |
| React Navigation (bottom tabs, native stack, native) | `7.19.2`, `7.19.2`, `7.4.1` | App navigation | MIT |
| OP-SQLite (`@op-engineering/op-sqlite`) | `18.2.3` | Local SQLite persistence | MIT package metadata; native dependencies have their own terms |
| `pdf-lib` and `@pdf-lib/fontkit` | `1.17.1`; `1.1.1` | PDF invoice generation and font embedding | MIT |
| `@react-native-documents/picker` | `12.0.2` | Selecting/importing files | MIT |
| `react-native-file-access`, `react-native-share` | `4.0.4`; `12.3.1` | File access and sharing/export | MIT |
| `react-native-safe-area-context`, `react-native-screens` | `5.10.0`; `4.28.0` | Native layout and screen integration | MIT |
| `@react-native-vector-icons/material-design-icons` | `13.1.4` | Material Design Icons glyphs | Library code and glyph artwork have separate license terms; see **Icons** below |

Versions above are resolved versions recorded in `package-lock.json`. Other npm packages and native platform dependencies may carry additional license and notice requirements. Keep applicable upstream notices with distributed source and builds.

## Bundled fonts

Font files are present in `src/assets/fonts/` and duplicate Android assets under `android/app/src/main/assets/fonts/`. iOS font registration is configured in `ios/BusinessManager/Info.plist`.

| Font family | Files | License | Included notice |
|---|---|---|---|
| Inter | `Inter-{Regular,Medium,SemiBold,Bold}.ttf` | SIL Open Font License 1.1 (OFL-1.1) | [Inter OFL text](licenses/Inter-OFL-1.1.txt); [upstream source](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt) |
| Noto Sans | `NotoSans-{Regular,Bold}.ttf` | SIL Open Font License 1.1 (OFL-1.1) | [Noto Sans OFL text](licenses/NotoSans-OFL-1.1.txt); [upstream source](https://github.com/google/fonts/blob/main/ofl/notosans/OFL.txt) |
| Poppins | `Poppins-{Medium,SemiBold,Bold}.ttf` | SIL Open Font License 1.1 (OFL-1.1) | [Poppins OFL text](licenses/Poppins-OFL-1.1.txt); [upstream source](https://github.com/google/fonts/blob/main/ofl/poppins/OFL.txt) |

The SIL Open Font License permits fonts to be bundled and redistributed with software subject to its conditions, including preservation of required notices and restrictions on selling the font software by itself. The project license does not replace the OFL.

## Icons

- **Library code:** `@react-native-vector-icons/material-design-icons@13.1.4`; the package metadata declares MIT. See the included [React Native Vector Icons MIT license](licenses/React-Native-Vector-Icons-MIT.txt).
- **Glyph artwork:** the Material Design Icons/Pictogrammers glyph set has its own applicable license. See the included [Pictogrammers license text](licenses/MaterialDesignIcons-Pictogrammers-License.txt), [Apache 2.0 text](licenses/Apache-2.0.txt), and the [upstream Material Design Icons license](https://github.com/Templarian/MaterialDesign/blob/master/LICENSE).

The icon wrapper code and glyph artwork are separate components with separate license terms.

## App icon and screenshots

- `src/assets/appIcon/BusinessManager.png` is the source artwork generated for this project using OpenAI image generation. Android and iOS launcher resources are platform-specific variants of that artwork.
- `docs/assets/screenshots/` contains screenshots captured from Business Manager running in an Android emulator. The customer list contains synthetic demo contact data.
- No separate third-party illustration or stock-art package is identified in the reviewed asset list.

## Native dependencies

Android native dependencies are configured through Gradle and React Native autolinking. iOS native dependencies are configured through CocoaPods. Native dependencies retain their own applicable license and notice terms.

## Related notices

- [Starter source-available license](../LICENSE)
- [Third-party notices](../THIRD_PARTY_NOTICES.md)
- [Apache 2.0](licenses/Apache-2.0.txt)
- [Inter OFL 1.1](licenses/Inter-OFL-1.1.txt)
- [Material Design Icons / Pictogrammers license](licenses/MaterialDesignIcons-Pictogrammers-License.txt)
- [Noto Sans OFL 1.1](licenses/NotoSans-OFL-1.1.txt)
- [Poppins OFL 1.1](licenses/Poppins-OFL-1.1.txt)
- [React Native Vector Icons MIT license](licenses/React-Native-Vector-Icons-MIT.txt)
