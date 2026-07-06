param(
    [string]$ApiBaseUrl = "http://10.0.2.2:5001/api/",
    [string]$WebUrl = "http://10.0.2.2:3001/"
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$gradle = Join-Path $env:USERPROFILE ".gradle\wrapper\dists\gradle-8.11.1-bin\bpt9gzteqjrbo1mjrsomdt32c\gradle-8.11.1\bin\gradle.bat"

if (-not (Test-Path $gradle)) {
    $candidate = Get-ChildItem (Join-Path $env:USERPROFILE ".gradle\wrapper\dists\gradle-8.11.1-bin") -Recurse -Filter gradle.bat -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
    if (-not $candidate) {
        throw "Gradle 8.11.1 was not found in the local Gradle cache."
    }
    $gradle = $candidate
}

Push-Location $projectDir
try {
    & $gradle :app:assembleDebug "-PzingoApiBaseUrl=$ApiBaseUrl" "-PzingoWebUrl=$WebUrl"
} finally {
    Pop-Location
}
