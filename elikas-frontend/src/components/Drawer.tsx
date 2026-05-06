import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Button from "./Button";

interface Pin {
  id: number;
  name: string;
  description: string;
  lat: number;
  long: number;
}

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPin: Pin | null;
}

function DrawerComp({ open, onOpenChange, selectedPin }: DrawerProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "transition-all duration-300 inset-x-0 mx-auto w-full max-w-md",
          expanded ? "h-[80vh]" : "h-[200px]",
        )}
      >
        <div className="flex justify-center">
          <Button
            text={expanded ? "Press to Collapse" : "Press to Expand"}
            id="Drawer-Handle"
            variant="outline"
            onClick={() => setExpanded(!expanded)}
          ></Button>
        </div>
        <DrawerHeader>
          <DrawerTitle>{selectedPin?.name}</DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <div
          className={cn(
            "p-4 overflow-auto transition-opacity duration-300",
            expanded ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <p>
            Coordinates: {selectedPin?.lat}, {selectedPin?.long}
          </p>
          <p>{selectedPin?.description}</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default DrawerComp;
