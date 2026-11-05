//! `yolo_interop` - a tiny, dependency-free C ABI surface used to demonstrate
//! real cross-language interop between Rust and C#/.NET in the yolo-cross
//! workspace.
//!
//! Every exported function uses `extern "C"` and only C-compatible (blittable)
//! types so it can be consumed from C# via `[LibraryImport]`/`[DllImport]`
//! P/Invoke, from C/C++ via a generated header, or from any other C ABI caller.
//!
//! Built as a `cdylib` this produces `yolo_interop.dll` on Windows (MSVC) and
//! `libyolo_interop.so` on Linux.

use std::os::raw::c_char;

/// Add two 32-bit integers (wrapping on overflow).
///
/// The simplest possible P/Invoke smoke test: C# -> Rust, value in, value out.
#[no_mangle]
pub extern "C" fn yolo_cross_add(a: i32, b: i32) -> i32 {
    a.wrapping_add(b)
}

/// Compute the 64-bit FNV-1a hash of a caller-provided byte buffer.
///
/// Demonstrates passing a pointer + length across the boundary (the shape of
/// almost every real C ABI, e.g. hashing, compression, parsing).
///
/// # Safety
/// `ptr` must point to at least `len` readable bytes, or be null when
/// `len == 0`. The buffer is only read, never retained.
#[no_mangle]
pub unsafe extern "C" fn yolo_cross_fnv1a64(ptr: *const u8, len: usize) -> u64 {
    const OFFSET_BASIS: u64 = 0xcbf2_9ce4_8422_2325;
    const PRIME: u64 = 0x0000_0100_0000_01b3;
    let mut hash = OFFSET_BASIS;
    if !ptr.is_null() && len != 0 {
        let bytes = std::slice::from_raw_parts(ptr, len);
        for &byte in bytes {
            hash ^= byte as u64;
            hash = hash.wrapping_mul(PRIME);
        }
    }
    hash
}

/// A native function-pointer callback type: `int (*)(int)` in C terms.
pub type IntCallback = extern "C" fn(i32) -> i32;

/// Invoke a native callback with `x` and return its result.
///
/// This is the key demonstration of native code calling *into* managed code:
/// C# passes a `[UnmanagedCallersOnly]` function pointer here, and Rust invokes
/// it. Returns `x` unchanged when the callback is null.
#[no_mangle]
pub extern "C" fn yolo_cross_apply(cb: Option<IntCallback>, x: i32) -> i32 {
    match cb {
        Some(f) => f(x),
        None => x,
    }
}

/// Return a pointer to a static, NUL-terminated UTF-8 version string.
///
/// The returned pointer is valid for the lifetime of the process and must not
/// be freed by the caller. Demonstrates returning a C string to be marshalled
/// by `Marshal.PtrToStringUTF8` on the C# side.
#[no_mangle]
pub extern "C" fn yolo_cross_version() -> *const c_char {
    // Static byte string with an explicit trailing NUL.
    const VERSION: &[u8] = b"yolo_interop 0.1.0\0";
    VERSION.as_ptr() as *const c_char
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_wraps() {
        assert_eq!(yolo_cross_add(40, 2), 42);
    }

    #[test]
    fn fnv1a_known_vector() {
        // FNV-1a/64 of the empty input is the offset basis.
        let empty = unsafe { yolo_cross_fnv1a64(std::ptr::null(), 0) };
        assert_eq!(empty, 0xcbf2_9ce4_8422_2325);
    }

    extern "C" fn double_it(x: i32) -> i32 {
        x * 2
    }

    #[test]
    fn apply_calls_back() {
        assert_eq!(yolo_cross_apply(Some(double_it), 21), 42);
        assert_eq!(yolo_cross_apply(None, 7), 7);
    }
}
