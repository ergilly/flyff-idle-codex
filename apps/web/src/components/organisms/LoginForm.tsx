"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { TextField } from "@/components/atoms/TextField";
import { login, register } from "@/lib/api";

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
    <div className="stack">
      <div className="auth-switch" role="group" aria-label="Auth mode">
        <button
          className={mode === "login" ? "switch-button active" : "switch-button"}
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
          className={mode === "register" ? "switch-button active" : "switch-button"}
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
      <form className="stack" onSubmit={handleSubmit}>
        {isRegistering ? (
          <TextField
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
        {error ? <ErrorMessage message={error} /> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Working..." : isRegistering ? "Create profile" : "Log in"}
        </Button>
      </form>
    </div>
  );
}
