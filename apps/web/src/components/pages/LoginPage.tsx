import { LoginForm } from "@/components/organisms/LoginForm";
import { PageHeader } from "@/components/molecules/PageHeader";
import { AuthTemplate } from "@/components/templates/AuthTemplate";

export function LoginPage() {
  return (
    <AuthTemplate>
      <PageHeader
        eyebrow="Flyff Idle"
        title="Welcome back"
        description="Sign in to continue to your character roster."
      />
      <LoginForm />
    </AuthTemplate>
  );
}
