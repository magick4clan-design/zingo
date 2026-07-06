# Zingo Android

Android shell app that loads the local Zingo website inside a WebView.

## Build

```powershell
cd "D:\serial site\android"
.\build-debug.ps1
```

Debug APK output:

```text
app\build\outputs\apk\debug\app-debug.apk
```

## Install On Connected Device

```powershell
cd "D:\serial site\android"
.\install-debug.ps1
```

## URLs

The emulator build uses:

```text
http://10.0.2.2:3001/
```

and the site continues to use the backend configured in the local Next.js app.

For USB testing on a physical Android phone, `install-debug.ps1` builds with:

```text
http://127.0.0.1:3001/
```

and runs `adb reverse tcp:3001 tcp:3001` plus `adb reverse tcp:5001 tcp:5001` automatically.
