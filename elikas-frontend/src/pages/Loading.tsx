import logo from "@/assets/logo.svg";
import { Spinner } from "@/components/ui/spinner";
import colors from "@/constants/colors";

function Loading() {
  return (
    <div className="min-h-screen w-full flex justify-center">
      <div className="w-full max-w-md flex justify-center items-center flex-col gap-8">
        <div className="flex flex-col gap-2">
          <img src={logo} className="mr-4" />
          <p
            className="self-center BeVietnamPro font-bold text-3xl"
            style={{ color: colors.heading }}
          >
            eLikas
          </p>
        </div>
        <Spinner className="size-8 text-gray-400" />
      </div>
    </div>
  );
}

export default Loading;
