import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import { Input, PasswordInput } from "../components/ui/FormField";
import { Alert } from "../components/ui/ErrorState";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getErrorMessage } from "../utils/errors";
import { validateLogin } from "../utils/validators";
import { firstName } from "../utils/format";

export default function Login() {
  useDocumentTitle("Log in");
  const { login, sessionMessage, clearSessionMessage } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({
    email: location.state?.email || "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/dashboard";

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (serverError) setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setServerError("");
    clearSessionMessage();
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${firstName(user?.name)}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not log you in. Please try again."));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back! 👋"
      subtitle="Log in to keep practising with Speakify."
      footer={
        <>
          New to Speakify? <Link to="/register">Create a free account</Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {sessionMessage && !serverError && <Alert tone="info">{sessionMessage}</Alert>}
        <Alert>{serverError}</Alert>

        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={values.email}
          onChange={update("email")}
          error={errors.email}
          autoFocus
        />
        <PasswordInput
          label="Password"
          icon={Lock}
          placeholder="Your password"
          autoComplete="current-password"
          value={values.password}
          onChange={update("password")}
          error={errors.password}
        />

        <Button type="submit" size="lg" fullWidth loading={submitting} iconRight={ArrowRight}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
