import AuthForm from "../AuthForm";
import { signupAction } from "../actions";

export const metadata = { title: "Start free trial — Stencil Studio" };

export default function SignupPage() {
  return <AuthForm mode="signup" action={signupAction} />;
}
