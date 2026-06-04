// app/forgot-password/page.tsx
import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send you a link to set a new one"
      altText="Remember it after all?"
      altHref="/login"
      altLabel="Sign in"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
