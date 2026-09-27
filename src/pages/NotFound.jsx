import { ArrowLeft } from "lucide-react";
import Mascot from "../components/illustrations/Mascot";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import useAuth from "../hooks/useAuth";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page not found");
  const { isAuthenticated } = useAuth();
  return (
    <div className="not-found">
      <Logo />
      <div className="not-found__body">
        <Mascot size={130} mood="thinking" />
        <p className="not-found__code">404</p>
        <h1>Oops! This page wandered off</h1>
        <p>The page you're looking for doesn't exist or has moved.</p>
        <Button to={isAuthenticated ? "/dashboard" : "/"} icon={ArrowLeft}>
          {isAuthenticated ? "Back to dashboard" : "Back to home"}
        </Button>
      </div>
    </div>
  );
}
