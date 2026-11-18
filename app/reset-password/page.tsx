import { AuthPage } from "@/components/auth-page";
export const metadata = { title: "Choose a new password" };
export default function Reset(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return <AuthPage kind="reset" {...props} />;
}
