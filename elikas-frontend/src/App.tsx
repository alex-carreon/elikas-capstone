import LogIn from "./pages/Authentication/LogIn";
import SplashRegistration from "./pages/Authentication/SplashRegistration";
import FormRegistration from "./pages/Authentication/FormRegistration";
import EmailVerif from "./pages/Authentication/EmailVerif";
import ContactNo from "./pages/Authentication/ContactNo";
import CustomizeProfile from "./pages/Authentication/CustomizeProfile";
import Permissions from "./pages/Authentication/Permissions";
import Finish from "./pages/Authentication/Finish";
import GuestNavbar from "./Navbar/GuestNavbar";
import AuthNavbar from "./Navbar/AuthNavbar";
import ConstNavbar from "./Navbar/ConstNavbar";
import Map from "@/pages/Map";
import Hotlines from "@/pages/Hotlines";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Settings from "./pages/Settings";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoutes";
import SMS from "./pages/SMS";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Login" element={<LogIn />} />

        <Route path="/Registration">
          <Route path="Splash" element={<SplashRegistration />} />
          <Route path="Form" element={<FormRegistration />} />
          <Route path="Verify" element={<EmailVerif />} />
          <Route path="Contact" element={<ContactNo />} />
          <Route path="CustomProfile" element={<CustomizeProfile />} />
          <Route path="Permissions" element={<Permissions />} />
          <Route path="Finish" element={<Finish />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AuthNavbar />}>
            <Route path="/Map" element={<Map />} />
          </Route>

          <Route element={<ConstNavbar />}>
            <Route path="/Settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute userRole={"brgy_op"} />}>
          <Route element={<ConstNavbar />}>
            <Route path="/SMS" element={<SMS />} />
          </Route>
        </Route>

        <Route element={<GuestNavbar />}>
          <Route path="/" element={<Map />} />
        </Route>

        <Route element={<ConstNavbar />}>
          <Route path="/Hotlines" element={<Hotlines />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
