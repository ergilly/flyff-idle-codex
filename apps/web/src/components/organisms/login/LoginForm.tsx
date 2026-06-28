"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { Stack } from "@/components/atoms/Stack";
import { TextField } from "@/components/atoms/TextField";
import { login, register } from "@/lib/api";
import { cx } from "@/lib/classNames";

type AuthMode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("test@flyff-idle.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === "register";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = isRegistering
        ? await register(displayName, email, password)
        : await login(email, password);
      localStorage.setItem("flyffIdleToken", session.token);
      localStorage.setItem("flyffIdleUser", JSON.stringify(session.user));
      router.push("/characters");
    } catch {
      setError(
        isRegistering
          ? "That profile could not be created. Try a different email."
          : "Those login details did not match a player account."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack data-testid="login_div_form_shell">
      <div
        className="grid grid-cols-2 overflow-hidden rounded-control border border-border bg-panel-muted"
        data-testid="login_div_mode_group"
        role="group"
        aria-label="Auth mode"
      >
        <button
          className={cx(
            "min-h-10 cursor-pointer border-0 font-extrabold",
            mode === "login"
              ? "bg-panel text-foreground shadow-[inset_0_0_0_1px_var(--primary)]"
              : "bg-transparent text-text-muted"
          )}
          data-testid="login_button_mode_login"
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
            setEmail("test@flyff-idle.local");
            setPassword("password123");
          }}
        >
          Login
        </button>
        <button
          className={cx(
            "min-h-10 cursor-pointer border-0 font-extrabold",
            mode === "register"
              ? "bg-panel text-foreground shadow-[inset_0_0_0_1px_var(--primary)]"
              : "bg-transparent text-text-muted"
          )}
          data-testid="login_button_mode_register"
          type="button"
          onClick={() => {
            setMode("register");
            setError("");
            setEmail("");
            setPassword("");
          }}
        >
          Register
        </button>
      </div>
      <Stack as="form" data-testid="login_form_auth" onSubmit={handleSubmit}>
        {isRegistering ? (
          <TextField
            data-testid="login_input_display_name"
            id="displayName"
            label="Display name"
            name="displayName"
            type="text"
            autoComplete="nickname"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            minLength={2}
            maxLength={32}
          />
        ) : null}
        <TextField
          data-testid="login_input_email"
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          data-testid="login_input_password"
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete={isRegistering ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
        {error ? <ErrorMessage message={error} testId="login_error_auth" /> : null}
        <Button data-testid="login_button_submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Working..." : isRegistering ? "Create profile" : "Log in"}
        </Button>
      </Stack>
    </Stack>
  );
}
