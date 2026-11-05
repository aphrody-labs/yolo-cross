using System.Runtime.InteropServices;
using System.Text;

namespace YoloCross.Interop;

/// <summary>
/// Safe, idiomatic managed wrappers over the <c>yolo_interop</c> C ABI.
/// Callers use these instead of touching <see cref="NativeMethods"/> directly.
/// </summary>
public static class Native
{
    /// <summary>Add two integers via the Rust cdylib (P/Invoke smoke test).</summary>
    public static int Add(int a, int b) => NativeMethods.yolo_cross_add(a, b);

    /// <summary>Compute the FNV-1a/64 hash of <paramref name="data"/> in Rust.</summary>
    public static unsafe ulong Fnv1a64(ReadOnlySpan<byte> data)
    {
        fixed (byte* p = data)
        {
            return NativeMethods.yolo_cross_fnv1a64(p, (nuint)data.Length);
        }
    }

    /// <summary>Compute the FNV-1a/64 hash of a UTF-8 encoded string in Rust.</summary>
    public static ulong Fnv1a64(string text) => Fnv1a64(Encoding.UTF8.GetBytes(text));

    /// <summary>
    /// Round-trip through native code: hand Rust a pointer to the managed
    /// <see cref="Exports.ManagedDouble"/> function and let Rust call it.
    /// Exercises native -> managed callbacks in-process.
    /// </summary>
    public static unsafe int ApplyManagedDouble(int x)
        => NativeMethods.yolo_cross_apply(&Exports.ManagedDouble, x);

    /// <summary>Return the native library's version string.</summary>
    public static unsafe string Version()
    {
        byte* p = NativeMethods.yolo_cross_version();
        return Marshal.PtrToStringUTF8((IntPtr)p) ?? string.Empty;
    }
}
