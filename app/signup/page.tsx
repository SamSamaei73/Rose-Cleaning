import { AuthPage } from "@/components/auth-page";
export const metadata = { title: "Create an account" };
export default function Signup(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return <AuthPage kind="signup" {...props} />;
}
