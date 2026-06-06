// app/login/page.tsx
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Enter your Execution System"
      subtitle="Track your trades. Understand your behavior. Improve execution consistency."
      altText="Don't have access yet?"
      altHref="/signup"
      altLabel="Request Beta Access"
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
