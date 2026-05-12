import { Link, useNavigate } from "react-router";
import { ArrowLeftIcon } from "lucide-react";
import Logo from "@/components/Logo";
import colors from "@/constants/colors";
import TextField from "@/components/TextField";
import { useState } from "react";
import ButtonComp from "@/components/Button";
import { createAvatar } from "@dicebear/core";
import { bigSmile } from "@dicebear/collection";

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

function CustomizeProfile() {
  const [username, setUsername] = useState("");
  const [seed, setSeed] = useState("Felix");

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("username", username);
    localStorage.setItem("avatarSeed", seed);

    navigate("/Registration/Permissions");
  };

  const avatar = createAvatar(bigSmile, {
    seed: seed,
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    radius: 50,
    scale: 90,
    accessoriesProbability: 50,
    eyes: ["cheery", "normal", "starstruck", "winking"],
    mouth: ["braces", "gapSmile", "kawaii", "openedSmile", "teethSmile"],
  });

  const dataUri = avatar.toDataUri();

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
          onSubmit={handleSubmit}
          className="h-full flex justify-between flex-col"
        >
          <div className=" flex flex-col gap-10">
            <div className="w-full flex flex-col justify-center items-center m-0 gap-2">
              <img src={dataUri} className="w-24" />
              <ButtonComp
                text="Generate New Avatar"
                id="R-Avatar"
                variant="outline"
                onClick={() => setSeed(randomSeed())}
              />
            </div>
            <div className="flex justify-start flex-col content-center">
              <TextField
                label="Username"
                placeholder="Enter your preferred user name"
                inputType="text"
                id="R-Username"
                isRequired
                onSubmit={(e) => setUsername(e.target.value)}
              ></TextField>
            </div>
          </div>
          <div className="w-full flex justify-center items-center m-0">
            {/* <Link to="/" className="w-full max-w-xs"> */}
            <ButtonComp
              text="Next"
              variant="primary"
              type="submit"
              id="R-SubmitUsername"
            ></ButtonComp>
            {/* </Link> */}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomizeProfile;
