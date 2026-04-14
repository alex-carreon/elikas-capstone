import Logo from "../assets/logo.svg";
import colors from "../constants/colors";

function LogoComp() {
  return (
    <div className={"h-auto w-22 flex flex-row justify-between"}>
      <img src={Logo} className="w-8"></img>
      <p
        className="self-center BeVietnamPro font-bold"
        style={{ color: colors.heading }}
      >
        eLikas
      </p>
    </div>
  );
}

export default LogoComp;
