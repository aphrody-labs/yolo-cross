import { describe, expect, test } from "bun:test";
import {
  Errno,
  strerror,
  Signal,
  SigSet,
  OpenFlags,
  Whence,
  FileMode,
  TermiosConstants,
  createDefaultTermios,
  cfmakeraw,
  getoptLong,
  HasArg,
  asprintf,
  programInvocationName,
  programInvocationShortName,
} from "../src/index";

describe("yolo-posix-bun test suite", () => {
  test("errno and strerror", () => {
    expect(Errno.ENOENT).toBe(2);
    expect(Errno.EBADF).toBe(9);
    expect(Errno.EINVAL).toBe(22);
    expect(strerror(Errno.ENOENT)).toBe("No such file or directory");
    expect(strerror(Errno.EBADF)).toBe("Bad file descriptor");
    expect(strerror(Errno.EINVAL)).toBe("Invalid argument");
    expect(strerror(99999)).toBe("Unknown error");
  });

  test("signals and sigset", () => {
    expect(Signal.SIGINT).toBe(2);
    expect(Signal.SIGTERM).toBe(15);
    expect(Signal.SIGUSR1).toBe(10);

    const sigset = SigSet.empty();
    expect(sigset.has(Signal.SIGINT)).toBe(false);
    sigset.add(Signal.SIGINT);
    expect(sigset.has(Signal.SIGINT)).toBe(true);
    sigset.del(Signal.SIGINT);
    expect(sigset.has(Signal.SIGINT)).toBe(false);

    const full = SigSet.fill();
    expect(full.has(Signal.SIGTERM)).toBe(true);
  });

  test("vfs flags and stat constants", () => {
    expect(OpenFlags.O_RDONLY).toBe(0);
    expect(OpenFlags.O_WRONLY).toBe(1);
    expect(OpenFlags.O_RDWR).toBe(2);
    expect(Whence.SEEK_SET).toBe(0);
    expect(Whence.SEEK_CUR).toBe(1);
    expect(Whence.SEEK_END).toBe(2);
    expect(FileMode.S_IFREG).toBe(0o100000);
    expect(FileMode.S_IFDIR).toBe(0o040000);
  });

  test("termios constants and raw mode", () => {
    const term = createDefaultTermios();
    expect(term.c_lflag & TermiosConstants.ICANON).not.toBe(0);
    expect(term.c_lflag & TermiosConstants.ECHO).not.toBe(0);

    cfmakeraw(term);
    expect(term.c_lflag & TermiosConstants.ICANON).toBe(0);
    expect(term.c_lflag & TermiosConstants.ECHO).toBe(0);
    expect(term.c_cc[TermiosConstants.VMIN]).toBe(1);
    expect(term.c_cc[TermiosConstants.VTIME]).toBe(0);
  });

  test("gnu extensions: getopt_long", () => {
    const args = ["--host=127.0.0.1", "-p", "9000", "--verbose", "app.wasm"];

    const longopts = [
      { name: "host", hasArg: HasArg.RequiredArgument, val: "h" },
      { name: "verbose", hasArg: HasArg.NoArgument, val: "v" },
    ];

    const results = getoptLong(args, "h:p:v", longopts);
    expect(results).toEqual([
      { type: "opt", val: "h", arg: "127.0.0.1" },
      { type: "opt", val: "p", arg: "9000" },
      { type: "opt", val: "v" },
      { type: "non-opt", val: "app.wasm" },
    ]);
  });

  test("gnu extensions: asprintf & invocation name", () => {
    const res = asprintf("Hello %s, error code %d", "POSIX", 42);
    expect(res).toBe("Hello POSIX, error code 42");

    expect(typeof programInvocationName()).toBe("string");
    expect(typeof programInvocationShortName()).toBe("string");
  });
});
