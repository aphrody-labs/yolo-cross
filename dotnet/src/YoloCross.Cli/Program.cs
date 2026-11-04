using YoloCross.Interop;

// A tiny console app that exercises the full interop surface and self-checks
// the results, returning a non-zero exit code on any failure so CI / receipts
// can trust it.

Console.WriteLine("yolo-cross dotnet interop demo");
Console.WriteLine("==============================");
Console.WriteLine($"native library version : {Native.Version()}");
Console.WriteLine($"add(40, 2)             : {Native.Add(40, 2)}");
Console.WriteLine($"fnv1a64(\"yolo\")        : 0x{Native.Fnv1a64("yolo"):x16}");
Console.WriteLine($"rust -> C# callback(21): {Native.ApplyManagedDouble(21)}");
Console.WriteLine();

int passed = 0, total = 0;

void Check(string name, bool ok)
{
    total++;
    if (ok) passed++;
    Console.WriteLine($"  [{(ok ? "PASS" : "FAIL")}] {name}");
}

Check("rust add(40,2) == 42", Native.Add(40, 2) == 42);
Check("rust callback doubles 21 -> 42", Native.ApplyManagedDouble(21) == 42);
Check("version reports yolo_interop", Native.Version().Contains("yolo_interop"));
// FNV-1a/64 of the ASCII string "yolo" is a stable, well-defined value.
Check("fnv1a64(\"yolo\") == 0xd32f1249a87757c8", Native.Fnv1a64("yolo") == 0xd32f1249a87757c8UL);

Console.WriteLine();
Console.WriteLine($"{passed}/{total} checks passed");
return passed == total ? 0 : 1;
