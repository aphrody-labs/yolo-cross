/*
 * call_managed.c - a tiny native (C) program that loads the NativeAOT-produced
 * C# shared library `yolo_managed.dll` and calls its [UnmanagedCallersOnly]
 * exports through the plain C ABI. This closes the loop: native code calling
 * into C# with no .NET runtime pre-installed (NativeAOT bundles it).
 *
 * Build (from the dir containing yolo_managed.dll), e.g.:
 *   clang call_managed.c -o call_managed.exe        (Windows, clang/clang-cl)
 *
 * The DLL is resolved from the current working directory / PATH at run time.
 */
#include <windows.h>
#include <stdio.h>

typedef int (*int_int_fn)(int);
typedef int (*int_int_int_fn)(int, int);

int main(void) {
    HMODULE lib = LoadLibraryA("yolo_managed.dll");
    if (lib == NULL) {
        fprintf(stderr, "FAIL: could not load yolo_managed.dll (error %lu)\n",
                (unsigned long)GetLastError());
        return 2;
    }

    int_int_fn dbl = (int_int_fn)GetProcAddress(lib, "yolo_managed_double");
    int_int_int_fn add = (int_int_int_fn)GetProcAddress(lib, "yolo_managed_add");
    if (dbl == NULL || add == NULL) {
        fprintf(stderr, "FAIL: missing export(s)\n");
        return 3;
    }

    int d = dbl(21);
    int a = add(40, 2);
    printf("native C -> C#: yolo_managed_double(21) = %d\n", d);
    printf("native C -> C#: yolo_managed_add(40, 2) = %d\n", a);

    int ok = (d == 42) && (a == 42);
    printf("%s\n", ok ? "PASS: native code called C# NativeAOT exports" : "FAIL");
    FreeLibrary(lib);
    return ok ? 0 : 1;
}
