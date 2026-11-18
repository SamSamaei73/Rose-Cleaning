import { AuthPage } from "@/components/auth-page";
export const metadata = { title: "Log in" };
export default function Login(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return <AuthPage kind="login" {...props} />;
}
