using System.Runtime.InteropServices;

namespace YoloCross.NativeExport;

/// <summary>
/// C# functions exported as native symbols for consumption by C/C++/Rust.
/// Built with NativeAOT (<c>NativeLib=Shared</c>, <c>PublishAot=true</c>), each
/// <see cref="UnmanagedCallersOnlyAttribute.EntryPoint"/> becomes a real
/// exported symbol in the produced shared library (verify with
/// <c>dumpbin /exports</c> on Windows or <c>nm -D</c> on Linux).
/// </summary>
public static class Managed
{
    /// <summary>Double an integer. Exported as <c>yolo_managed_double</c>.</summary>
    [UnmanagedCallersOnly(EntryPoint = "yolo_managed_double")]
    public static int Double(int x) => x * 2;

    /// <summary>Add two integers. Exported as <c>yolo_managed_add</c>.</summary>
    [UnmanagedCallersOnly(EntryPoint = "yolo_managed_add")]
    public static int Add(int a, int b) => a + b;
}
