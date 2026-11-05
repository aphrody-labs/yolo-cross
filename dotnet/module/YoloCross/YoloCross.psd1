@{
    RootModule        = 'YoloCross.psm1'
    ModuleVersion     = '0.1.0'
    GUID              = '7f3a2c9e-1b6d-4e8a-9f2c-5d4b7a0e13c6'
    Author            = 'yolo-cross'
    CompanyName       = 'yolo-rs'
    Copyright         = '(c) yolo-rs contributors. Licensed under MIT OR Apache-2.0.'
    Description       = 'Loads and exercises the YoloCross.Interop managed + Rust native interop library from PowerShell 7.'
    PowerShellVersion = '7.4'
    FunctionsToExport = @(
        'Get-YoloCrossVersion',
        'Invoke-YoloCrossAdd',
        'Get-YoloCrossHash',
        'Invoke-YoloCrossCallback',
        'Test-YoloCross'
    )
    CmdletsToExport   = @()
    VariablesToExport = @()
    AliasesToExport   = @()
    PrivateData = @{
        PSData = @{
            Tags = @('interop', 'rust', 'pinvoke', 'native-aot', 'yolo-cross')
        }
    }
}
