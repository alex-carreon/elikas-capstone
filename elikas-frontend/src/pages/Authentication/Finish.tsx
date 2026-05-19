import { useNavigate } from "react-router";
import colors from "@/constants/colors";
import ButtonComp from "@/components/Button";
import { useUserContext } from "@/context/AuthContext";
import { roleDefault } from "@/components/ProtectedRoutes";
import RegisterHeader from "@/components/RegisterHeader";

function Finish() {
  const navigate = useNavigate();
  const { role } = useUserContext();

  const handleRedirect = () => {
    if (!role) return;
    console.log(role);
    navigate(roleDefault[role]);
  };

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <RegisterHeader />
        <div className="h-3/4 flex justify-center flex-col">
          <div className="flex justify-evenly flex-col">
            <div className="flex justify-center flex-col">
              <h1
                className="BeVietnamPro text-2xl text-center font-bold"
                style={{ color: colors.heading }}
              >
                You're good to go!
              </h1>
              <p
                className="text-sm text-center p-1"
                style={{ color: colors.heading }}
              >
                Welcome to eLikas! Help others and stay informed.
              </p>
            </div>
            <div className="w-full flex justify-center items-center mt-6">
              <ButtonComp
                text="Get Started!"
                variant="primary"
                id="Finish_FinishBtn"
                onClick={handleRedirect}
                heightSize="38px"
                widthSize="100%"
              ></ButtonComp>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Finish;
