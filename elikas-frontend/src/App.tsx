import LogIn from "./Authentication/LogIn";
import SplashRegistration from "./Authentication/SplashRegistration";
import FormRegistration from "./Authentication/FormRegistration";
import EmailVerif from "./Authentication/EmailVerif";
import ContactNo from "./Authentication/ContactNo";
import CustomizeProfile from "./Authentication/CustomizeProfile";
import Permissions from "./Authentication/Permissions";
import Finish from "./Authentication/Finish";
import Navbar from "./Navbar/GuestNavbar";
import ConstNavbar from "./Navbar/ConstNavbar";
import Map from "./Map";
import Hotlines from "@/Hotlines";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

        <Route element={<Navbar />}>
          <Route path="/Guest" element={<Map />} />
        </Route>

        <Route element={<ConstNavbar />}>
          <Route path="/Hotlines" element={<Hotlines />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
