// app/signup/page.tsx
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      title="Start your journal"
      subtitle="Free for the first 6 months"
      altText="Already have an account?"
      altHref="/login"
      altLabel="Sign in"
    >
      <SignupForm />
    </AuthShell>
  );
}
