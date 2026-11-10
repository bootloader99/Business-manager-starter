const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const fontsDir = path.join(projectRoot, 'src', 'assets', 'fonts');
const outputPath = path.join(
    projectRoot,
    'src',
    'services',
    'pdf',
    'pdfFonts.ts',
);

const fonts = {
    NotoSansRegular: 'NotoSans-Regular.ttf',
    NotoSansBold: 'NotoSans-Bold.ttf',
};

const generated = `// Generated from src/assets/fonts. Do not edit manually.

export const notoSansRegular = '${fs
        .readFileSync(path.join(fontsDir, fonts.NotoSansRegular))
        .toString('base64')}';

export const notoSansBold = '${fs
        .readFileSync(path.join(fontsDir, fonts.NotoSansBold))
        .toString('base64')}';
`;

fs.writeFileSync(outputPath, generated, 'utf8');

console.log(`Generated ${path.relative(projectRoot, outputPath)}`);