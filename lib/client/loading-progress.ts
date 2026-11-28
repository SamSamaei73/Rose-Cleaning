type Operation = { label: string; priority: number };
type LoadingSnapshot = { label: string } | null;
const operations = new Map<string, Operation>();
const listeners = new Set<() => void>();
let snapshot: LoadingSnapshot = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let scheduled = false;
export const LOADING_THRESHOLD_MS = 250;

function publish(next: LoadingSnapshot) {
  if (snapshot?.label === next?.label) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}
function currentOperation() {
  let selected: Operation | undefined;
  for (const operation of operations.values())
    if (!selected || operation.priority > selected.priority)
      selected = operation;
  return selected;
}
function reconcile() {
  scheduled = false;
  const operation = currentOperation();
  if (!operation) {
    clearTimeout(timer);
    timer = undefined;
    publish(null);
  } else if (snapshot) {
    publish({ label: operation.label });
  } else if (!timer) {
    timer = setTimeout(() => {
      timer = undefined;
      const pending = currentOperation();
      if (pending) publish({ label: pending.label });
    }, LOADING_THRESHOLD_MS);
  }
}
function schedule() {
  // Coalesce effect cleanup/setup during route handoffs; never extend a completed wait.
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(reconcile);
}

/** One delayed overlay for any number of overlapping requests or route boundaries. */
export const loadingProgress = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  snapshot: () => snapshot,
  serverSnapshot: (): LoadingSnapshot => null,
  begin(id: string, label: string, priority = 2) {
    const operation = { label, priority };
    operations.set(id, operation);
    schedule();
    return () => {
      if (operations.get(id) !== operation) return;
      operations.delete(id);
      schedule();
    };
  },
};
