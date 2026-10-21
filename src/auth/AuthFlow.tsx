import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import {
  AuthUser,
  googleSignIn,
  login,
  registerCandidate,
  registerInvitation,
  requestPasswordReset,
  resetPassword,
  Role,
  verifyEmail,
} from "./api";

type AuthScreen = "login" | "register" | "forgot" | "reset" | "verify";

type AuthFlowProps = {
  role: Role | null;
  initialScreen?: AuthScreen;
  invitationToken?: string;
  verifyToken?: string;
  resetToken?: string;
  onBack: () => void;
  onSuccess: (user: AuthUser) => void;
};

const roleNames: Record<Role, string> = {
  candidate: "Candidate",
  recruiter: "HR / Recruiter",
  coordinator: "Coordinator",
};

export function AuthFlow({
  role,
  initialScreen = "login",
  invitationToken,
  verifyToken,
  resetToken,
  onBack,
  onSuccess,
}: AuthFlowProps) {
  const [screen, setScreen] = useState<AuthScreen>(verifyToken ? "verify" : resetToken ? "reset" : initialScreen);
  const [selectedRole, setSelectedRole] = useState<Role | "">(role ?? "");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!verifyToken) return;
    let active = true;
    setLoading(true);
    verifyEmail(verifyToken)
      .then(({ user }) => {
        if (active) onSuccess(user);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Email verification failed.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [verifyToken, onSuccess]);

  const changeScreen = (next: AuthScreen) => {
    setError("");
    setNotice("");
    setPassword("");
    setScreen(next);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (screen === "login") {
        if (!selectedRole) throw new Error("Select a workspace role to continue.");
        const result = await login(email, password, selectedRole);
        onSuccess(result.user);
      } else if (screen === "register") {
        if (!name.trim()) throw new Error("Enter your name.");
        if (invitationToken) {
          const result = await registerInvitation(name, email, password, invitationToken);
          onSuccess(result.user);
        } else {
          if (selectedRole !== "candidate") {
            throw new Error("Recruiter and coordinator accounts require an invitation.");
          }
          await registerCandidate(name, email, password);
          setNotice("Check your inbox for a verification link before signing in.");
          setScreen("login");
        }
      } else if (screen === "forgot") {
        await requestPasswordReset(email);
        setNotice("If an account exists for that address, recovery instructions have been sent.");
      } else if (screen === "reset") {
        if (!resetToken) throw new Error("The password reset link is missing or invalid.");
        await resetPassword(resetToken, password);
        setNotice("Password updated. You can now sign in.");
        setScreen("login");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The request could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  const title =
    screen === "register" ? "Create your account" :
    screen === "forgot" ? "Reset your password" :
    screen === "reset" ? "Choose a new password" :
    screen === "verify" ? "Verify your email" :
    "Welcome back";
  const subtitle =
    screen === "register" && invitationToken ? "Accept your invitation to join the Arclight workspace." :
    screen === "register" ? "Create a candidate account to get started." :
    screen === "forgot" ? "We’ll email you a secure password reset link." :
    screen === "reset" ? "Use at least 12 characters for your new password." :
    screen === "verify" ? "Confirming your email address securely." :
    "Sign in to continue to your authorized workspace.";
  const showPasswordField = screen === "login" || screen === "register" || screen === "reset";

  return (
    <main className="auth-page">
      <button className="auth-back" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand"><span className="brand-mark"><span /><span /><span /></span><span>Arclight</span></div>
        <span className="auth-eyebrow"><ShieldCheck size={14} /> SECURE WORKSPACE ACCESS</span>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        {screen === "verify" && loading && <div className="auth-status">Verifying your email…</div>}
        {screen !== "verify" && (
          <form className="auth-form" onSubmit={submit}>
            {screen === "login" && !invitationToken && (
              <label>
                Workspace
                <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as Role | "")} required>
                  <option value="" disabled>Select your role</option>
                  {(role ? [role] : ["candidate", "recruiter", "coordinator"] as Role[]).map((option) => (
                    <option value={option} key={option}>{roleNames[option]}</option>
                  ))}
                </select>
              </label>
            )}
            {screen === "register" && (
              <label>
                Full name
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={160} />
              </label>
            )}
            {(screen === "login" || screen === "register" || screen === "forgot") && (
              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  maxLength={320}
                />
              </label>
            )}
            {showPasswordField && (
              <label>
                {screen === "login" ? "Password" : "Password"}
                <span className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={screen === "login" ? "current-password" : "new-password"}
                    minLength={screen === "login" ? 1 : 12}
                    maxLength={128}
                    required
                  />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
            )}
            {error && <div className="auth-error" role="alert">{error}</div>}
            {notice && <div className="auth-notice" role="status">{notice}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Please wait…" : screen === "login" ? "Sign in" : screen === "register" ? "Create account" : screen === "forgot" ? "Send reset link" : "Update password"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>
        )}

        {screen === "login" && (
          <>
            <button className="auth-text-action" onClick={() => changeScreen("forgot")}>Forgot password?</button>
            {import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true" && selectedRole && (
              <div className="auth-divider"><span>or</span></div>
            )}
            {import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true" && selectedRole && (
              <button className="button button-outline auth-google" onClick={() => googleSignIn(selectedRole)}>
                <span className="google-g">G</span> Continue with Google
              </button>
            )}
            {selectedRole === "candidate" && (
              <p className="auth-switch">New to Arclight? <button onClick={() => changeScreen("register")}>Create a candidate account</button></p>
            )}
            {(selectedRole === "recruiter" || selectedRole === "coordinator") && (
              <p className="auth-switch">Workspace accounts are invitation-only.</p>
            )}
          </>
        )}
        {screen === "register" && !invitationToken && (
          <p className="auth-switch">Already registered? <button onClick={() => changeScreen("login")}>Sign in</button></p>
        )}
        {screen === "register" && invitationToken && (
          <p className="auth-switch">Invited accounts are assigned their role by a coordinator.</p>
        )}
        {(screen === "forgot" || screen === "reset") && (
          <p className="auth-switch"><button onClick={() => changeScreen("login")}>Return to sign in</button></p>
        )}
      </section>
      <p className="auth-footnote">Your password is never shared with Google.</p>
    </main>
  );
}
