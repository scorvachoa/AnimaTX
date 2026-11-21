// One shared FIFO queue for all heavy operations. Deletion can only acquire when idle.
export function createJobLock() {
  let held = false;
  const queue = [];
  const grant = () => {
    held = true;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      held = false;
      const next = queue.shift();
      if (next) {
        next.cleanup();
        next.resolve(grant());
      }
    };
  };
  return {
    tryAcquire() {
      return held || queue.length ? null : grant();
    },
    acquire(signal) {
      if (signal?.aborted) return Promise.reject(Error("Operación cancelada."));
      if (!held) return Promise.resolve(grant());
      return new Promise((resolve, reject) => {
        const entry = {
          resolve,
          cleanup: () => signal?.removeEventListener("abort", abort),
        };
        const abort = () => {
          const index = queue.indexOf(entry);
          if (index >= 0) queue.splice(index, 1);
          entry.cleanup();
          reject(Error("Operación cancelada."));
        };
        queue.push(entry);
        signal?.addEventListener("abort", abort, { once: true });
      });
    },
    state() {
      return { busy: held, queued: queue.length };
    },
  };
}
