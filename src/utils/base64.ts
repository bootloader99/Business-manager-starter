export function uint8ArrayToBase64(
    bytes: Uint8Array,
): string {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    let result = '';

    for (let i = 0; i < bytes.length; i += 3) {
        const byte1 = bytes[i];
        const byte2 =
            i + 1 < bytes.length ? bytes[i + 1] : 0;
        const byte3 =
            i + 2 < bytes.length ? bytes[i + 2] : 0;

        const triplet =
            (byte1 << 16) |
            (byte2 << 8) |
            byte3;

        result +=
            chars[(triplet >> 18) & 0x3f];

        result +=
            chars[(triplet >> 12) & 0x3f];

        result +=
            i + 1 < bytes.length
                ? chars[(triplet >> 6) & 0x3f]
                : '=';

        result +=
            i + 2 < bytes.length
                ? chars[triplet & 0x3f]
                : '=';
    }

    return result;
}