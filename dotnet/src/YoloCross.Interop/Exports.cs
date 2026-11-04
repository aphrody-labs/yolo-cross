using System.Runtime.InteropServices;

namespace YoloCross.Interop;

/// <summary>
/// Managed functions exposed to native code.
/// </summary>
public static class Exports
{
    /// <summary>
    /// A managed function callable directly from native code.
    /// <para>
    /// <see cref="UnmanagedCallersOnlyAttribute"/> makes the method callable
    /// only through a function pointer from unmanaged code (never from managed
    /// C#). It is used two ways in this project:
    /// </para>
    /// <list type="bullet">
    /// <item>In-process: its address is taken as a
    /// <c>delegate* unmanaged&lt;int,int&gt;</c> and handed to Rust, which
    /// invokes it (see <see cref="Native.ApplyManagedDouble"/>).</item>
    /// <item>As a native export: under a NativeAOT <c>NativeLib</c> build the
    /// <see cref="UnmanagedCallersOnlyAttribute.EntryPoint"/> makes it a real
    /// exported symbol named <c>yolo_managed_double</c> in the produced
    /// shared library.</item>
    /// </list>
    /// </summary>
    [UnmanagedCallersOnly(EntryPoint = "yolo_managed_double")]
    public static int ManagedDouble(int x) => x * 2;
}
