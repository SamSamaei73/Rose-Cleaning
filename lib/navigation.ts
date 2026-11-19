/** Homepage requests enter the account area; a selected service survives sign-in. */
export function customerEntryHref(signedIn: boolean, service?: string) {
  const dashboard = service
    ? `/dashboard?service=${encodeURIComponent(service)}`
    : "/dashboard";
  return signedIn ? dashboard : `/login?next=${encodeURIComponent(dashboard)}`;
}
