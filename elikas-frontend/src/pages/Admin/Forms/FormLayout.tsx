import WhiteLogo from "@/components/Admin/WhiteLogo";
import { ArrowLeft } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import ButtonComp from "@/components/Button";

interface FormLayoutProps {
  isAvatar?: boolean;
  children: React.ReactNode;
  updateId?: string;
  deleteId?: string;
  deleteClick?: () => void;
  updateClick?: () => void;
}

function FormLayout({
  isAvatar,
  children,
  updateId,
  deleteId,
  deleteClick,
  updateClick,
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
      <div className="h-full w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <div className="pt-6 bg-[#FFB13B] px-6 pb-14 flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
              <p className="text-white BeVietnamPro text-2xl font-bold">
                User Details
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
            <div className="bg-white h-content w-full -m-2 rounded-lg flex flex-col gap-8">
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
              {updateId && deleteId ? (
                <div className="mx-4 flex justify-evenly shrink gap-4 mb-8">
                  <ButtonComp
                    text="Update"
                    variant="primary"
                    id={updateId}
                    heightSize="38px"
                    type="button"
                    onClick={updateClick}
                  />

                  <ButtonComp
                    text="Delete"
                    variant="outline"
                    id={deleteId}
                    heightSize="38px"
                    type="button"
                    onClick={deleteClick}
                  />
                </div>
              ) : (
                <div className="w-full flex justify-center items-center px-4 mb-8">
                  {updateId && (
                    <ButtonComp
                      text="Update"
                      variant="primary"
                      id={updateId}
                      heightSize="38px"
                      type="button"
                      onClick={updateClick}
                    />
                  )}
                  {deleteId && (
                    <ButtonComp
                      text="Delete"
                      variant="outline"
                      id={deleteId}
                      heightSize="38px"
                      type="button"
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
