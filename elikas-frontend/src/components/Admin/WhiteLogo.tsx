import Logo from "@/assets/logoWhite.svg";

function WhiteLogo() {
  return (
    <div className="h-auto w-22 flex flex-row justify-between gap-1">
      <img src={Logo} className="w-8"></img>
      <p className="self-center BeVietnamPro font-bold text-white text-lg">
        eLikas
      </p>
    </div>
  );
}

export default WhiteLogo;
