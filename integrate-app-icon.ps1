
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Get-Location
$source = Join-Path $root "src\assets\appIcon\BusinessManager.png"
$res = Join-Path $root "android\app\src\main\res"
$ios = Join-Path $root "ios\BusinessManager\Images.xcassets\AppIcon.appiconset"

if (!(Test-Path $source)) { throw "Master icon not found: $source" }
if (!(Test-Path $res)) { throw "Android resources not found: $res" }
if (!(Test-Path $ios)) { throw "iOS AppIcon catalog not found: $ios" }

# Keep a backup of existing native launcher images.
$backup = Join-Path $root "app-icon-backup"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Get-ChildItem $res -Recurse -Filter "ic_launcher*.png" |
    ForEach-Object {
        $relative = $_.FullName.Substring($res.Length).TrimStart('\')
        $dest = Join-Path $backup $relative
        New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
        Copy-Item $_.FullName $dest -Force
    }

$master = [System.Drawing.Bitmap]::new($source)

function Save-Icon {
    param(
        [System.Drawing.Image]$Image,
        [string]$Path,
        [int]$Size,
        [bool]$SolidBackground = $false
    )

    $bmp = [System.Drawing.Bitmap]::new(
        $Size, $Size,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($SolidBackground) {
        $g.Clear([System.Drawing.Color]::FromArgb(24, 61, 50))
    }

    $g.DrawImage($Image, 0, 0, $Size, $Size)
    $g.Dispose()

    New-Item -ItemType Directory -Force -Path (Split-Path $Path) | Out-Null
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

try {
    # Legacy Android launcher icons.
    $legacy = @{
        "mipmap-mdpi"    = 48
        "mipmap-hdpi"    = 72
        "mipmap-xhdpi"   = 96
        "mipmap-xxhdpi"  = 144
        "mipmap-xxxhdpi" = 192
    }

    foreach ($entry in $legacy.GetEnumerator()) {
        $folder = Join-Path $res $entry.Key
        foreach ($name in @("ic_launcher.png", "ic_launcher_round.png")) {
            Save-Icon $master (Join-Path $folder $name) $entry.Value
        }
    }

    # Adaptive icon foreground assets use a 108dp canvas.
    $adaptive = @{
        "mipmap-mdpi"    = 108
        "mipmap-hdpi"    = 162
        "mipmap-xhdpi"   = 216
        "mipmap-xxhdpi"  = 324
        "mipmap-xxxhdpi" = 432
    }

    foreach ($entry in $adaptive.GetEnumerator()) {
        Save-Icon $master `
            (Join-Path (Join-Path $res $entry.Key) "ic_launcher_foreground.png") `
            $entry.Value
    }

    $anydpi = Join-Path $res "mipmap-anydpi-v26"
    New-Item -ItemType Directory -Force -Path $anydpi | Out-Null

    $adaptiveXml = @'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
'@

    Set-Content -Encoding UTF8 `
        (Join-Path $anydpi "ic_launcher.xml") $adaptiveXml
    Set-Content -Encoding UTF8 `
        (Join-Path $anydpi "ic_launcher_round.xml") $adaptiveXml

    $values = Join-Path $res "values"
    New-Item -ItemType Directory -Force -Path $values | Out-Null
    Set-Content -Encoding UTF8 `
        (Join-Path $values "ic_launcher_background.xml") `
        '<?xml version="1.0" encoding="utf-8"?><resources><color name="ic_launcher_background">#183D32</color></resources>'

    # iOS AppIcon catalog: generate all image sizes referenced by Contents.json.
    $iosSpecs = @(
        @{ File = "Icon-20@2x.png"; Size = 40 }
        @{ File = "Icon-20@3x.png"; Size = 60 }
        @{ File = "Icon-29@2x.png"; Size = 58 }
        @{ File = "Icon-29@3x.png"; Size = 87 }
        @{ File = "Icon-40@2x.png"; Size = 80 }
        @{ File = "Icon-40@3x.png"; Size = 120 }
        @{ File = "Icon-60@2x.png"; Size = 120 }
        @{ File = "Icon-60@3x.png"; Size = 180 }
        @{ File = "Icon-1024.png"; Size = 1024 }
    )

    foreach ($spec in $iosSpecs) {
        Save-Icon $master (Join-Path $ios $spec.File) $spec.Size $true
    }

    $contents = @{
        images = @(
            @{ filename = "Icon-20@2x.png"; idiom = "iphone"; scale = "2x"; size = "20x20" }
            @{ filename = "Icon-20@3x.png"; idiom = "iphone"; scale = "3x"; size = "20x20" }
            @{ filename = "Icon-29@2x.png"; idiom = "iphone"; scale = "2x"; size = "29x29" }
            @{ filename = "Icon-29@3x.png"; idiom = "iphone"; scale = "3x"; size = "29x29" }
            @{ filename = "Icon-40@2x.png"; idiom = "iphone"; scale = "2x"; size = "40x40" }
            @{ filename = "Icon-40@3x.png"; idiom = "iphone"; scale = "3x"; size = "40x40" }
            @{ filename = "Icon-60@2x.png"; idiom = "iphone"; scale = "2x"; size = "60x60" }
            @{ filename = "Icon-60@3x.png"; idiom = "iphone"; scale = "3x"; size = "60x60" }
            @{ filename = "Icon-1024.png"; idiom = "ios-marketing"; scale = "1x"; size = "1024x1024" }
        )
        info = @{ author = "xcode"; version = 1 }
    }

    $contents | ConvertTo-Json -Depth 8 |
        Set-Content -Encoding UTF8 (Join-Path $ios "Contents.json")

    Write-Host "Native icon assets generated successfully." -ForegroundColor Green
    Write-Host "Backup of previous Android launcher PNGs: $backup"
    Write-Host "Master PNG was not modified."
}
finally {
    $master.Dispose()
}
