"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { Stack } from "@/components/atoms/Stack";
import { TextField } from "@/components/atoms/TextField";
import { login, register } from "@/lib/api";
import { cx } from "@/lib/classNames";

type AuthMode = "login" | "register";

function validateAuthInput(mode: AuthMode, displayName: string, email: string, password: string) {
  const trimmedDisplayName = displayName.trim();
  const trimmedEmail = email.trim();

  if (mode === "register") {
    if (!trimmedDisplayName) {
      return "Please enter your display name";
    }

    if (trimmedDisplayName.length < 2) {
      return "Display name must be at least 2 characters";
    }

    if (trimmedDisplayName.length > 32) {
      return "Display name must be 32 characters or fewer";
    }
  }

  if (!trimmedEmail) {
    return "Please enter your email address";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return "Please enter a valid email address";
  }

  if (!password) {
    return "Please enter your password";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  return "";
}

export function LoginForm() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("test@flyff-idle.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === "register";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validationError = validateAuthInput(mode, displayName, email, password);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const session = isRegistering
        ? await register(displayName, email, password)
        : await login(email, password);
      localStorage.setItem("flyffIdleToken", session.token);
      localStorage.setItem("flyffIdleUser", JSON.stringify(session.user));
      router.push("/characters");
    } catch (error) {
      const fallbackMessage = isRegistering
        ? "That profile could not be created. Try a different email."
        : "Unable to log in with those details.";
      setError(error instanceof Error && error.message ? error.message : fallbackMessage);
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
          disabled={!isHydrated}
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
          disabled={!isHydrated}
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
      <Stack
        as="form"
        data-hydrated={isHydrated ? "true" : "false"}
        data-testid="login_form_auth"
        noValidate
        onSubmit={handleSubmit}
      >
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
        <Button data-testid="login_button_submit" type="submit" disabled={!isHydrated || isSubmitting}>
          {isSubmitting ? "Working..." : isRegistering ? "Create profile" : "Log in"}
        </Button>
      </Stack>
    </Stack>
  );
}
