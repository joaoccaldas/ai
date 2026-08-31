import AuthForm from "../AuthForm";
import { loginAction } from "../actions";

export const metadata = { title: "Sign in — Stencil Studio" };

export default function LoginPage() {
  return <AuthForm mode="login" action={loginAction} />;
}
