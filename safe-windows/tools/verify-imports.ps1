param(
    [Parameter(Mandatory = $true)]
    [string[]] $Files
)

$ErrorActionPreference = "Stop"

$forbidden = @(
    "WINHTTP",
    "WININET",
    "WS2_32",
    "URLMON",
    "OpenProcess",
    "WriteProcessMemory",
    "CreateRemoteThread",
    "NtWriteVirtualMemory",
    "SetWindowsHookEx",
    "GetAsyncKeyState",
    "CreateProcess",
    "ShellExecute",
    "RegOpenKey",
    "RegSetValue",
    "InternetOpen",
    "WinHttpOpen"
)

foreach ($file in $Files) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        throw "Missing build output: $file"
    }

    $imports = (& dumpbin /nologo /imports $file | Out-String)
    if ($LASTEXITCODE -ne 0) {
        throw "dumpbin failed for $file"
    }

    foreach ($needle in $forbidden) {
        if ($imports -match [regex]::Escape($needle)) {
            throw "Forbidden import '$needle' found in $file"
        }
    }

    Write-Host "Import check passed: $file"
}
