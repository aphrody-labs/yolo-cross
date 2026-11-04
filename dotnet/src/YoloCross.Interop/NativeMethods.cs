using System.Runtime.InteropServices;

namespace YoloCross.Interop;

/// <summary>
/// Source-generated P/Invoke surface for the Rust <c>yolo_interop</c> cdylib
/// (C ABI). <see cref="LibraryImportAttribute"/> generates the marshalling stub
/// at compile time, which keeps the calls trim-safe and NativeAOT-compatible
/// (unlike reflection-based <c>DllImport</c>).
/// </summary>
internal static unsafe partial class NativeMethods
{
    /// <summary>
    /// Base library name. The .NET loader maps this to <c>yolo_interop.dll</c>
    /// on Windows and <c>libyolo_interop.so</c> on Linux.
    /// </summary>
    internal const string Library = "yolo_interop";

    [LibraryImport(Library)]
    internal static partial int yolo_cross_add(int a, int b);

    [LibraryImport(Library)]
    internal static partial ulong yolo_cross_fnv1a64(byte* ptr, nuint len);

    [LibraryImport(Library)]
    internal static partial int yolo_cross_apply(delegate* unmanaged<int, int> cb, int x);

    [LibraryImport(Library)]
    internal static partial byte* yolo_cross_version();
}
