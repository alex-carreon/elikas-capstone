import api from "@/api";
import ButtonComp from "@/components/Button";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await api.post("/auth/logout");
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="pt-13">
      <ButtonComp
        text="Logout"
        variant="primary"
        id="LogoutBtn"
        onClick={handleLogout}
      ></ButtonComp>
    </div>
  );
}

export default Settings;
