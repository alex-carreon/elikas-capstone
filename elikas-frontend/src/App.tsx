import LogIn from "./pages/Authentication/LogIn";
import SplashRegistration from "./pages/Authentication/SplashRegistration";
import FormRegistration from "./pages/Authentication/FormRegistration";
import EmailVerif from "./pages/Authentication/EmailVerif";
import ContactNo from "./pages/Authentication/ContactNo";
import CustomizeProfile from "./pages/Authentication/CustomizeProfile";
import Permissions from "./pages/Authentication/Permissions";
import Finish from "./pages/Authentication/Finish";
import GuestNavbar from "./components/Navbar/GuestNavbar";
import AuthNavbar from "./components/Navbar/AuthNavbar";
import ConstNavbar from "./components/Navbar/ConstNavbar";
import Map from "@/pages/Map";
import Hotlines from "@/pages/Hotlines";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Settings from "@/pages/Settings";
import ProtectedRoute from "./components/ProtectedRoutes";
import SMS from "./pages/brgy_ops/SMS";
import EvacForm from "./pages/Forms/EvacForms";
import HazardForm from "./pages/Forms/HazardForm";
import History from "@/pages/Indiv/History";
import ForgotPW from "./pages/Authentication/ForgotPW";
import TermsConditions from "./pages/TermsConditions";
import Loading from "./pages/Loading";
import Profile from "./pages/Profile";
import Feedback from "./pages/Indiv/Feedback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Loading" element={<Loading />} />
        <Route path="/Login" element={<LogIn />} />
        <Route path="/ResetPassword" element={<ForgotPW />} />
        <Route path="/Registration">
          <Route path="Splash" element={<SplashRegistration />} />
          <Route path="Form" element={<FormRegistration />} />
          <Route path="Verify" element={<EmailVerif />} />
          <Route path="Contact" element={<ContactNo />} />
          <Route path="CustomProfile" element={<CustomizeProfile />} />
          <Route path="Permissions" element={<Permissions />} />
          <Route path="Finish" element={<Finish />} />
        </Route>

        <Route element={<ProtectedRoute userRole={"indiv"} />}>
          <Route element={<ConstNavbar />}>
            <Route path="/History" element={<History />} />
            <Route path="/Feedback" element={<Feedback />} />
            <Route path="/Settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute userRole={"brgy_op"} />}>
          <Route element={<ConstNavbar />}>
            <Route path="/SMS" element={<SMS />} />
            <Route path="/Settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AuthNavbar />}>
            <Route path="/Map" element={<Map />} />
          </Route>

          <Route element={<ConstNavbar />}>
            <Route path="/EvacForm" element={<EvacForm />} />
            <Route path="/HazardForm" element={<HazardForm />} />
            <Route path="/Profile" element={<Profile />} />
          </Route>
        </Route>

        {/* <Route element={<AlertModal />}> */}
        <Route element={<GuestNavbar />}>
          <Route path="/" element={<Map />} />
        </Route>
        {/* </Route> */}

        <Route element={<ConstNavbar />}>
          <Route path="/Hotlines" element={<Hotlines />} />
          <Route path="/TermsConditions" element={<TermsConditions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
