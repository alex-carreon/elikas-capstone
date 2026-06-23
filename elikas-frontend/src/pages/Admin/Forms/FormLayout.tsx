import WhiteLogo from "@/components/Admin/WhiteLogo";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import ButtonComp from "@/components/Button";

interface FormLayoutProps {
  isAvatar?: boolean;
  children: React.ReactNode;
  updateId?: string;
  deleteId?: string;
  submitUpdId?: string;
  closeUpdId?: string;
  deleteClick?: (e?: React.FormEvent<Element>) => void;
  updateClick?: (e?: React.FormEvent<Element>) => void;
  closeUpdClick?: () => void;
  isEditable?: boolean;
  formId?: string;
  updBtnLabel?: string;
  btnType?: "button" | "submit" | "reset" | undefined;
  formTitle?: string;
  singleUpd?: () => void;
  isDisabled?: boolean;
}

function FormLayout({
  isAvatar,
  children,
  updateId,
  deleteId,
  deleteClick,
  updateClick,
  isEditable,
  submitUpdId,
  closeUpdId,
  closeUpdClick,
  formId,
  updBtnLabel,
  btnType,
  formTitle,
  singleUpd,
  isDisabled,
}: FormLayoutProps) {
  const navigate = useNavigate();

  const avatar = createAvatar(bigSmile, {
    seed: "Felix",
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    radius: 50,
    scale: 90,
    accessoriesProbability: 50,
    eyes: ["cheery", "normal", "starstruck", "winking"],
    mouth: ["braces", "gapSmile", "kawaii", "openedSmile", "teethSmile"],
  });

  const dataUri = avatar.toDataUri();

  return (
    <>
      <div className="h-screen w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <div className="pt-6 bg-[#FFB13B] px-6 pb-14 flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
              <p className="text-white BeVietnamPro text-2xl font-bold">
                {formTitle}
              </p>
              <div className="text-white BeVietnamPro text-end">
                <WhiteLogo />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center -mt-12 h-full">
            <div className="bg-white h-12 w-9/10 rounded-lg flex items-center pt-2 pl-4">
              <ArrowLeft id="Admin_BackBtn" onClick={() => navigate(-1)} />
            </div>
            <div className="bg-white h-full w-full -m-2 rounded-lg flex flex-col justify-between">
              <div className="flex flex-col items-center">
                {isAvatar && <img src={dataUri} className="w-24" />}
                <div
                  className={
                    isAvatar
                      ? "w-full px-8 flex flex-col gap-4"
                      : "w-full px-8 pt-8 flex flex-col gap-4"
                  }
                >
                  {children}
                </div>
              </div>
              {isEditable && submitUpdId && closeUpdId ? (
                <>
                  <div className="mx-4 flex justify-evenly shrink gap-4 mb-8">
                    <ButtonComp
                      text="Submit"
                      variant="primary"
                      id={submitUpdId}
                      heightSize="38px"
                      type="submit"
                      formId={formId}
                      isDisabled={isDisabled}
                    />
                    <ButtonComp
                      text="Cancel"
                      variant="outline"
                      id={closeUpdId}
                      heightSize="38px"
                      type="button"
                      onClick={closeUpdClick}
                      isDisabled={isDisabled}
                    />
                  </div>
                </>
              ) : updateId && deleteId ? (
                <div className="mx-4 flex justify-evenly shrink gap-4 mb-8">
                  <ButtonComp
                    text={updBtnLabel ? updBtnLabel : "Update"}
                    variant="primary"
                    id={updateId}
                    heightSize="38px"
                    type="button"
                    onClick={updateClick}
                    isDisabled={isDisabled}
                  />
                  <ButtonComp
                    text="Delete"
                    variant="important"
                    id={deleteId}
                    heightSize="38px"
                    type="button"
                    onClick={deleteClick}
                    isDisabled={isDisabled}
                  />
                </div>
              ) : (
                <div className="w-full flex justify-center items-center px-4 mb-8">
                  {updateId && updBtnLabel && (
                    <ButtonComp
                      text={updBtnLabel}
                      variant="primary"
                      id={updateId}
                      heightSize="38px"
                      type={btnType}
                      onClick={singleUpd}
                      formId={formId}
                      isDisabled={isDisabled}
                    />
                  )}
                  {deleteId && (
                    <ButtonComp
                      text="Delete"
                      variant="important"
                      id={deleteId}
                      heightSize="38px"
                      type="button"
                      onClick={deleteClick}
                      isDisabled={isDisabled}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FormLayout;
