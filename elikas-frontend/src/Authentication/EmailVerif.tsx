import Logo from "@/components/Logo";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";

function EmailVerif() {
  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex justify-evenly flex-col">
        <div className="mb-6">
          <Link to="/Registration/Form" id="R-BackSplash">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
      </div>
    </div>
  );
}

export default EmailVerif;
