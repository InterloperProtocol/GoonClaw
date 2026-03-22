export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { startAutonomousRuntimeLoop } = await import(
    "@/lib/server/autonomous-runtime"
  );
  startAutonomousRuntimeLoop();
}
