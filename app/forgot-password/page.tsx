import { AuthPage } from "@/components/auth-page";
export const metadata = { title: "Reset your password" };
export default function Forgot(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return <AuthPage kind="forgot" {...props} />;
}
