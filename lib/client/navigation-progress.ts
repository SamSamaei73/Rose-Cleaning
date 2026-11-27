import { loadingProgress } from "./loading-progress";

let destination: string | undefined;
let finish: (() => void) | undefined;

export const navigationProgress = {
  start(target: string) {
    finish?.();
    destination = target;
    finish = loadingProgress.begin("history", "Opening your page…", 1);
  },
  commit(target: string) {
    if (destination === target) this.cancel();
  },
  cancel() {
    finish?.();
    finish = undefined;
    destination = undefined;
  },
};
