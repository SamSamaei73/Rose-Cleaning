/** Only the most important visible scene animates. Others retain their last frame. */
type SceneLease = {
  priority: number;
  eligible: boolean;
  notify: (active: boolean) => void;
};
const leases = new Set<SceneLease>();
function reconcile() {
  let winner: SceneLease | undefined;
  for (const lease of leases)
    if (lease.eligible && (!winner || lease.priority > winner.priority))
      winner = lease;
  for (const lease of leases) lease.notify(lease === winner);
}
export function leaseScene(priority: number, notify: SceneLease["notify"]) {
  const lease = { priority, eligible: false, notify };
  leases.add(lease);
  return {
    setEligible(eligible: boolean) {
      lease.eligible = eligible;
      reconcile();
    },
    release() {
      leases.delete(lease);
      notify(false);
      reconcile();
    },
  };
}
