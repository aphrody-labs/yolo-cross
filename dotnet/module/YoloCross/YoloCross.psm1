#Requires -Version 7.4
# YoloCross PowerShell 7 module: loads the built YoloCross.Interop managed
# assembly and exercises the Rust<->C# interop surface through it. This proves
# the library is usable from a PowerShell host, not just the console app.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-YoloCrossLibDir {
    <#.SYNOPSIS Find a directory containing the built YoloCross.Interop.dll + native lib.#>
    $moduleRoot = Split-Path -Parent $PSCommandPath
    $dotnetRoot = (Resolve-Path (Join-Path $moduleRoot '..\..')).Path
    $candidates = @(
        (Join-Path $dotnetRoot 'src\YoloCross.Cli\bin\Release\net10.0'),
        (Join-Path $dotnetRoot 'src\YoloCross.Cli\bin\Debug\net10.0'),
        (Join-Path $dotnetRoot 'publish\win-x64-aot')
    )
    foreach ($c in $candidates) {
        if (Test-Path (Join-Path $c 'YoloCross.Interop.dll')) { return (Resolve-Path $c).Path }
    }
    throw "YoloCross.Interop.dll not found. Build first: dotnet build -c Release (under $dotnetRoot)."
}

$script:LibDir = Resolve-YoloCrossLibDir

# Make the native yolo_interop.dll discoverable by the OS loader when the
# managed assembly's P/Invokes resolve it.
$sep = [System.IO.Path]::PathSeparator
if (($env:PATH -split [regex]::Escape($sep)) -notcontains $script:LibDir) {
    $env:PATH = "$script:LibDir$sep$env:PATH"
}

Add-Type -Path (Join-Path $script:LibDir 'YoloCross.Interop.dll')

function Get-YoloCrossVersion {
    <#.SYNOPSIS Version string reported by the native Rust library.#>
    [CmdletBinding()] param()
    [YoloCross.Interop.Native]::Version()
}

function Invoke-YoloCrossAdd {
    <#.SYNOPSIS Add two integers in Rust via P/Invoke.#>
    [CmdletBinding()] param([int]$A, [int]$B)
    [YoloCross.Interop.Native]::Add($A, $B)
}

function Get-YoloCrossHash {
    <#.SYNOPSIS FNV-1a/64 hash (hex) of a string, computed in Rust.#>
    [CmdletBinding()] param([Parameter(Mandatory)][string]$Text)
    '0x{0:x16}' -f ([YoloCross.Interop.Native]::Fnv1a64($Text))
}

function Invoke-YoloCrossCallback {
    <#.SYNOPSIS Round-trip: Rust calls the C# [UnmanagedCallersOnly] doubler.#>
    [CmdletBinding()] param([int]$X)
    [YoloCross.Interop.Native]::ApplyManagedDouble($X)
}

function Test-YoloCross {
    <#.SYNOPSIS Exercise every entry point and report a pass/fail object.#>
    [CmdletBinding()] param()
    $r = [ordered]@{
        LibDir      = $script:LibDir
        Version     = Get-YoloCrossVersion
        Add_40_2    = Invoke-YoloCrossAdd -A 40 -B 2
        Hash_yolo   = Get-YoloCrossHash -Text 'yolo'
        Callback_21 = Invoke-YoloCrossCallback -X 21
    }
    $r['Passed'] = ($r.Add_40_2 -eq 42) -and
                   ($r.Callback_21 -eq 42) -and
                   ($r.Version -like 'yolo_interop*') -and
                   ($r.Hash_yolo -eq '0xd32f1249a87757c8')
    [pscustomobject]$r
}

Export-ModuleMember -Function Get-YoloCrossVersion, Invoke-YoloCrossAdd,
    Get-YoloCrossHash, Invoke-YoloCrossCallback, Test-YoloCross
