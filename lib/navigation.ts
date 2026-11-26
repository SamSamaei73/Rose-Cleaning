/** Service requests enter the account area with the selected service. */
export function customerEntryHref(signedIn: boolean, service?: string) {
  const dashboard = service
    ? `/dashboard?service=${encodeURIComponent(service)}`
    : "/dashboard";
  return signedIn ? dashboard : `/login?next=${encodeURIComponent(dashboard)}`;
}
