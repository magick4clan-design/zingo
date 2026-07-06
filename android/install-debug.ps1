$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$adb = "C:\Users\Omen\Android\android-sdk\platform-tools\adb.exe"
$apk = Join-Path $projectDir "app\build\outputs\apk\debug\app-debug.apk"
$apiBaseUrl = "http://127.0.0.1:5001/api/"
$webUrl = "http://127.0.0.1:3001/"

if (-not (Test-Path $adb)) {
    throw "adb.exe was not found at $adb"
}

$devices = & $adb devices | Select-String -Pattern "`tdevice$"
if (-not $devices) {
    throw "No Android device or emulator is connected."
}

& $adb reverse tcp:3001 tcp:3001
& $adb reverse tcp:5001 tcp:5001
& (Join-Path $projectDir "build-debug.ps1") -ApiBaseUrl $apiBaseUrl -WebUrl $webUrl
& $adb install -r $apk
& $adb shell am start -n com.zingo.mobile/.MainActivity
