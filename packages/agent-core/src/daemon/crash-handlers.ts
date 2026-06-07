let installed = false;

export function installCrashHandlers(): void {
  if (installed) {
    return;
  }
  installed = true;

  process.on('uncaughtException', (_err) => {
    process.exit(1);
  });

  process.on('unhandledRejection', (_reason) => {
    process.exit(1);
  });
}
