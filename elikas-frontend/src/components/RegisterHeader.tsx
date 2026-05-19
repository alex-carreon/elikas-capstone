import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router";
import Logo from "./Logo";

function RegisterHeader() {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-6">
        <ArrowLeftIcon onClick={() => navigate(-1)} id="Register_Back" />
      </div>
      <div className="flex justify-center">
        <Logo />
      </div>
    </>
  );
}

export default RegisterHeader;
