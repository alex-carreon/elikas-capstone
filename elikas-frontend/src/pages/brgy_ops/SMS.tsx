import ButtonComp from "@/components/Button";
import CheckBox from "@/components/CheckBox";
import { Textarea } from "@/components/ui/textarea";
import colors from "@/constants/colors";

function SMS() {
  return (
    <div className="w-full h-full flex flex-col items-center ">
      <div className="w-full max-w-md pt-12 p-6 mt-8 mb-2 flex flex-col gap-4">
        <div>
          <p
            className="font-bold text-lg text-center"
            style={{ color: colors.heading }}
          >
            Emergency SMS Broadcast{" "}
          </p>
          <p
            className="text-align text-center italic text-sm"
            style={{ color: colors.label }}
          >
            Send verified announcements to registered contacts instantly.{" "}
          </p>
        </div>
        <div className="w-full max-w-sm">
          <p className="font-semibold text-xs">Message (Max Words: 1000)</p>
          <p
            className="italic text-xs justify-self-end"
            style={{ color: colors.label }}
          >
            Word Count: 23
          </p>
          <Textarea
            className="mt-2 h-150 text-xs"
            placeholder="Place your text message here"
          />
        </div>
        <ButtonComp
          id="SMS_SendBtn"
          text="Send Text"
          variant="primary"
          heightSize="38px"
          widthSize="100%"
        />
      </div>
    </div>
  );
}

export default SMS;
