// app/signup/page.tsx
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      title="Initialize your Execution System"
      subtitle="Track your trades. Understand your behavior. Improve execution consistency."
      altText="Already have access?"
      altHref="/login"
      altLabel="Access Execution System"
    >
      <SignupForm />
    </AuthShell>
  );
}
