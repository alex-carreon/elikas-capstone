import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function AlertDialogue({ onClose }: { onClose: () => void }) {
  return (
    <>
      <AlertDialog defaultOpen={true} onOpenChange={onClose}>
        <AlertDialogContent className="p-6 w-70">
          <AlertDialogHeader>
            <AlertDialogTitle>Turn on your Location/GPS</AlertDialogTitle>
            <AlertDialogDescription>
              Your location/GPS must be turned on to view routes. Plese turn
              this on in your phone settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="h-10" onClick={onClose}>
              Got it!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AlertDialogue;
