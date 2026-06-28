import { LoginForm } from "@/components/organisms/login/LoginForm";
import { PageHeader } from "@/components/molecules/PageHeader";
import { AuthTemplate } from "@/components/templates/login/AuthTemplate";

export function LoginPage() {
  return (
    <AuthTemplate>
      <PageHeader
        testId="login_header_page"
        eyebrow="Flyff Idle"
        title="Welcome back"
        description="Sign in to continue to your character roster."
      />
      <LoginForm />
    </AuthTemplate>
  );
}
