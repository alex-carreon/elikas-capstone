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
  onClick?: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
  buttonText: string;
  open: boolean;
}

function AlertDialogue({
  onClick,
  onClose,
  title,
  description,
  children,
  buttonText,
  open,
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
        >
          <AlertDialogHeader>
            <CircleX
              size={28}
              fill="#CECECE"
              strokeWidth={1}
              className="justify-self-end"
              onClick={onClose}
            />
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          {children}
          <AlertDialogFooter>
            <AlertDialogAction className="h-10 w-full" onClick={onClick}>
              {buttonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AlertDialogue;
