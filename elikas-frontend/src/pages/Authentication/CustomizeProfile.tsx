import { useNavigate } from "react-router";
import colors from "@/constants/colors";
import TextField from "@/components/TextField";
import { useState, useEffect } from "react";
import ButtonComp from "@/components/Button";
import { createAvatar } from "@dicebear/core";
import { bigSmile } from "@dicebear/collection";
import { Link } from "react-router";
import { ArrowLeftIcon } from "lucide-react";
import Logo from "@/components/Logo";

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

function CustomizeProfile() {
  const [username, setUsername] = useState("");
  const [seed, setSeed] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const avatar = createAvatar(bigSmile, {
    seed: seed ? seed : "Felix",
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    radius: 50,
    scale: 90,
    accessoriesProbability: 50,
    eyes: ["cheery", "normal", "starstruck", "winking"],
    mouth: ["braces", "gapSmile", "kawaii", "openedSmile", "teethSmile"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("username", username);
    localStorage.setItem("avatarSeed", seed);

    navigate("/Registration/Permissions");
  };

  const dataUri = avatar.toDataUri();

  useEffect(() => {
    if (username.length == 20) {
      setError("Username must be 20 characters only");
    } else {
      setError("");
    }
  }, [username]);

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-sm flex flex-col">
        <div className="mb-6">
          <Link to="/Registration/Contact" id="R-BackSplash">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="h-1/2 flex justify-evenly flex-col">
          <div>
            <h1
              className="BeVietnamPro text-2xl text-center font-bold"
              style={{ color: colors.heading }}
            >
              Customize your profile!
            </h1>
            <p
              className="text-sm text-center p-2"
              style={{ color: colors.heading }}
            >
              Your profile will be what your neighboring clouds will see you as.
              You can change this later.
            </p>
          </div>
        </div>
        <form
          id="Profile_Form"
          onSubmit={handleSubmit}
          className="h-full flex justify-between flex-col"
        >
          <div className=" flex flex-col gap-10">
            <div className="w-full flex flex-col justify-center items-center m-0 gap-2">
              <img src={dataUri} className="w-24" />
              <ButtonComp
                text="Generate New Avatar"
                id="Profile_RandommAvatarBtn"
                variant="outline"
                type="button"
                onClick={() => setSeed(randomSeed())}
              />
            </div>
            <div className="flex justify-start flex-col content-center">
              <TextField
                label="Username"
                placeholder="Enter your preferred user name"
                inputType="text"
                id="Profile_UsernameField"
                isRequired
                onSubmit={(e) => setUsername(e.target.value)}
                maxLength={20}
                error={error}
              ></TextField>
            </div>
          </div>
          <div className="w-full flex justify-center items-center m-0">
            <ButtonComp
              text="Next"
              variant="primary"
              type="submit"
              id="Profile_FormSubmitBtn"
              heightSize="38px"
              widthSize="100%"
            ></ButtonComp>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomizeProfile;