import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, UserRound } from "lucide-react";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import { Input, PasswordInput } from "../components/ui/FormField";
import { Alert } from "../components/ui/ErrorState";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getErrorMessage } from "../utils/errors";
import { passwordStrength, validateRegister } from "../utils/validators";
import { firstName } from "../utils/format";

export default function Register() {
  useDocumentTitle("Create account");
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (serverError) setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateRegister(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setServerError("");
    try {
      const user = await register(values);
      toast.success(`Welcome to Speakify, ${firstName(user?.name)}! 🎉`, "Your account is ready.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // If registration worked but the automatic login failed, send the user to log in.
      if (err?.config?.url?.includes("/auth/login")) {
        toast.info("Account created", "Please log in to continue.");
        navigate("/login", { replace: true, state: { email: values.email.trim() } });
        return;
      }
      setServerError(getErrorMessage(err, "Could not create your account. Please try again."));
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(values.password);

  return (
    <AuthLayout
      title="Join Speakify ✨"
      subtitle="Create a free account and start speaking with confidence."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Alert>{serverError}</Alert>

        <Input
          label="Full name"
          icon={UserRound}
          placeholder="Your name"
          autoComplete="name"
          value={values.name}
          onChange={update("name")}
          error={errors.name}
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={values.email}
          onChange={update("email")}
          error={errors.email}
        />
        <PasswordInput
          label="Password"
          icon={Lock}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          value={values.password}
          onChange={update("password")}
          error={errors.password}
        />
        {values.password && !errors.password && (
          <div className="strength" aria-live="polite">
            <div className="strength__bars">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={n <= strength.score ? `is-on is-${strength.score}` : ""} />
              ))}
            </div>
            <span className="strength__label">{strength.label}</span>
          </div>
        )}
        <PasswordInput
          label="Confirm password"
          icon={Lock}
          placeholder="Type it again"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
        />

        <Button type="submit" size="lg" fullWidth loading={submitting} iconRight={ArrowRight}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
