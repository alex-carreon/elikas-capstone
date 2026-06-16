import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CircleX } from "lucide-react";

interface AlertDialogueProps {
  title: string;
  description: string;
  onClick?: (e?: any) => void;
  onClick2?: (e?: any) => void;
  onClose?: () => void;
  children?: React.ReactNode;
  buttonText: string;
  buttonText2?: string;
  open: boolean;
  contentId: string;
  closeId?: string;
  actionId?: string;
  actionId2?: string;
  btnType?: "submit" | "button" | "reset" | undefined;
}

function AlertDialogue({
  onClick,
  onClick2,
  onClose,
  title,
  description,
  children,
  buttonText,
  buttonText2,
  open,
  contentId,
  closeId,
  actionId,
  actionId2,
  btnType,
}: AlertDialogueProps) {
  return (
    <>
      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose?.();
        }}
      >
        <AlertDialogContent
          className="p-4 w-70 z-[500] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          id={contentId}
        >
          <AlertDialogTitle />
          <AlertDialogHeader>
            {closeId && (
              <CircleX
                size={28}
                fill="#CECECE"
                strokeWidth={1}
                className="justify-self-end"
                onClick={onClose}
                id={closeId}
              />
            )}
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          {children}
          <AlertDialogFooter>
            <div className="w-full flex flex-col items-center gap-2">
              {actionId && (
                <AlertDialogAction
                  className="h-10 w-full"
                  onClick={onClick}
                  id={actionId}
                  type={btnType}
                >
                  {buttonText}
                </AlertDialogAction>
              )}
              {actionId2 && (
                <AlertDialogAction
                  className="h-10 w-full"
                  onClick={onClick2}
                  id={actionId2}
                  type={btnType}
                >
                  {buttonText2}
                </AlertDialogAction>
              )}
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AlertDialogue;
