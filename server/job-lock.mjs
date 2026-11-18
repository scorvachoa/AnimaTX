// Acquire before asynchronous work, release once on every completion path.
export function createJobLock() {
  let held = false;
  return {
    tryAcquire() {
      if (held) return null;
      held = true;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        held = false;
      };
    },
  };
}
