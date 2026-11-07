<#
.SYNOPSIS
    Aphrody & YOLO Authenticode Windows Signing & SmartScreen Validation Utility.
.DESCRIPTION
    Uses signtool.exe or osslsigncode to sign binary executables with Authenticode certificate,
    applies RFC 3161 timestamps, and prepares binaries for Microsoft SmartScreen reputation.
#>

param (
    [Parameter(Mandatory=$false)]
    [string]$BinaryPath = "C:\Users\aphro\.cargo\bin\aphrody.exe",
    
    [Parameter(Mandatory=$false)]
    [string]$CertPath = "$env:APHRODY_SIGN_PFX",
    
    [Parameter(Mandatory=$false)]
    [string]$CertPassword = "$env:APHRODY_SIGN_PASS",

    [Parameter(Mandatory=$false)]
    [string]$TimestampServer = "http://timestamp.digicert.com"
)

$ErrorActionPreference = "Stop"

Write-Host "[sign-windows] Locating signtool.exe..."
$signtool = (Get-Command signtool.exe -ErrorAction SilentlyContinue).Source
if (-not $signtool) {
    $signtool = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe"
}

if (-not (Test-Path $signtool)) {
    Write-Warning "signtool.exe not found at standard path: $signtool"
    exit 1
}

Write-Host "[sign-windows] Target binary: $BinaryPath"
if (-not (Test-Path $BinaryPath)) {
    Write-Error "Binary not found: $BinaryPath"
    exit 2
}

# If no commercial certificate provided, generate test self-signed code-signing cert
if (-not $CertPath -or -not (Test-Path $CertPath)) {
    Write-Host "[sign-windows] No external PFX provided. Generating self-signed test code signing certificate..."
    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject "CN=Aphrody Ecosystem Open Source Code Signing, O=Aphrody Labs, C=US" `
        -KeyUsage DigitalSignature `
        -KeyLength 3072 `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(5)

    $tempPfx = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "aphrody-codesign-test.pfx")
    $pfxPass = ConvertTo-SecureString -String "aphrody-test-pass" -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $tempPfx -Password $pfxPass | Out-Null
    
    $CertPath = $tempPfx
    $CertPassword = "aphrody-test-pass"
    Write-Host "[sign-windows] Generated temporary test PFX: $CertPath"
}

Write-Host "[sign-windows] Executing signtool.exe sign..."
& $signtool sign `
    /f $CertPath `
    /p $CertPassword `
    /fd SHA256 `
    /tr $TimestampServer `
    /td SHA256 `
    /d "Aphrody Unified Autonomous Runtime" `
    /du "https://aphrody.com" `
    $BinaryPath

Write-Host "[sign-windows] Verifying signature..."
& $signtool verify /pa /v $BinaryPath

Write-Host "[sign-windows] Authenticode signing and verification completed successfully."
