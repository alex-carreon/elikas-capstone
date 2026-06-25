import MapComp from "@/components/Map";
import "leaflet/dist/leaflet.css";
import Filter from "@/components/Filter";
import { MapContainer } from "react-leaflet";
import { type LatLngBoundsExpression } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { Map as LeafletMap } from "leaflet";
import { useUserContext } from "@/context/AuthContext";
import ButtonComp from "@/components/Button";
import CurrentLocation from "@/assets/Map/currentLocation.svg?react";
import AlertDialogue from "@/components/AlertDialogue";
import api from "@/api";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useInstall } from "@/context/InstallContext";

type pathReminder = {
  floodpath_id: number;
  flood_description: string;
  message: string;
  expiry: string;
};

function Map() {
  const [locationFound, setLocationFound] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showNearestRouteTrigger, setShowNearestRouteTrigger] = useState(0);
  const [pathReminder, setPathReminder] = useState<pathReminder[] | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const [selected, setSelected] = useState<
    Record<number, "Dismiss" | "Snooze" | null>
  >({});
  const [decidedCount, setDecidedCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const openDialog = useRef(false);

  const philippinesBounds: LatLngBoundsExpression = [
    [4.5, 116.0], // southwest corner
    [21.5, 127.0], // northeast corner
  ];

  const mapRef = useRef<LeafletMap | null>(null);

  // let authorized = false;
  const { role } = useUserContext();

  const { canInstall, triggerInstall } = useInstall();
  const showDownload = canInstall && !role;

  const getFloodExpired = async () => {
    try {
      const response = await api.get("/flood-reminders");
      setPathReminder(response.data.reminders);
      setReminderCount(response.data.count);
      // setExpiry(response.data.reminders.expiry);

      if (response.data.count > 0) {
        setShowReminder(true);
      }
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  const handleNearestRoute = () => {
    if (locationFound) {
      // setShowNearestRoute(true);
      // setShowRoute(false);
      // setSelectedPin(null);
      // setOpenFromRoute(true);
      setShowNearestRouteTrigger((prev) => prev + 1);
    } else console.log("Location not found");
  };

  const handleSnoozeSingle = async (id: number, e: React.FormEvent) => {
    e.preventDefault();

    try {
      setDismissed(true);
      await api.post("/flood-reminders/remind-later", {
        ids: [id],
      });

      toast.success(`Flood Path ID ${String(id)} snoozed!`);
      setDismissed(true);
    } catch (err: any) {
      console.log(err.response.message);
    }
  };

  const handleSnoozeAll = async (e: React.FormEvent) => {
    e.preventDefault();

    const ids = pathReminder?.map((path) => path.floodpath_id);

    try {
      await api.post("/flood-reminders/remind-later", {
        ids: ids,
      });

      toast.success("Flood Paths snoozed!");
      setShowReminder(false);
    } catch (err: any) {
      console.log(err.response.message);
    }
  };

  const handleDismissSingle = async (id: number, e: React.FormEvent) => {
    e.preventDefault();

    try {
      setDismissed(true);

      await api.post("/flood-reminders/dismiss", {
        ids: [id],
      });

      toast.success(`Flood Path ID ${String(id)} dismissed!`);
      setDismissed(true);
    } catch (err: any) {
      console.log(err.response.message);
    }
  };

  const handleDismissAll = async (e: React.FormEvent) => {
    e.preventDefault();

    const ids = pathReminder?.map((path) => path.floodpath_id);

    try {
      await api.post("/flood-reminders/dismiss", {
        ids: ids,
      });

      toast.success("Flood Paths dismissed!");
      setShowReminder(false);
    } catch (err: any) {
      console.log(err.response.message);
    }
  };

  const handleSelect = (itemId: number, value: "Dismiss" | "Snooze") => {
    setSelected((prev) => ({
      ...prev,
      [itemId]: value,
    }));

    setDecidedCount(+1);
  };

  useEffect(() => {
    if (!role) return;
    if (openDialog.current) return;

    openDialog.current = true;
    getFloodExpired();
  }, [role]);

  useEffect(() => {
    if (decidedCount === reminderCount) {
      setShowReminder(false);
    }
  }, [decidedCount]);

  return (
    <>
      {showDownload && (
        <AlertDialogue
          title="Welcome to eLikas!"
          description='Download the app to have the full experience by clicking on "Add to Home Screen" on your browser!'
          buttonText="Got it!"
          open={showDownload}
          contentId="Map_DLDialogContent"
          actionId="Map_CloseDLDialog"
          onClick={() => {
            triggerInstall();
          }}
        ></AlertDialogue>
      )}
      {showReminder && (
        <AlertDialogue
          title="Reminder: Hazard Pins"
          description={`${reminderCount} of your hazard pins are going to expire soon! Check in on them. Snooze will let us remind you again later!`}
          buttonText="Dismiss All"
          buttonText2="Snooze All"
          open={showReminder}
          contentId="Map_ReminderDialogContent"
          actionId="Map_DismissAll"
          actionId2="Map_SnoozeAll"
          onClick={(e) => {
            handleDismissAll(e);
            setDismissed(true);
          }}
          onClick2={(e) => {
            handleSnoozeAll(e);
            setDismissed(true);
          }}
          disabled={dismissed}
        >
          <div className="flex flex-col gap-2 overflow-auto h-fit max-h-[30vh]">
            {pathReminder?.map((path) => {
              const expiryDate = new Date(path.expiry);
              const now = new Date();

              const diffMs = expiryDate.getTime() - now.getTime();
              const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              return (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <div className="text-xs">
                      <p>Flood ID: {path.floodpath_id}</p>
                      <p>Message: {path.flood_description}</p>
                      <p>Expiring in: {daysLeft} days</p>
                    </div>
                    <div className="flex gap-2">
                      <ButtonComp
                        text="Dismiss"
                        variant="outline"
                        type="button"
                        id="Map_DismissID"
                        heightSize="28px"
                        onClick={(e) => {
                          handleDismissSingle(path.floodpath_id, e);
                          handleSelect(path.floodpath_id, "Dismiss");
                        }}
                        isDisabled={selected[path.floodpath_id] === "Snooze"}
                      />
                      <ButtonComp
                        text="Snooze"
                        variant="outline"
                        type="button"
                        id="Map_SnoozeID"
                        heightSize="28px"
                        onClick={(e) => {
                          handleSnoozeSingle(path.floodpath_id, e);
                          handleSelect(path.floodpath_id, "Snooze");
                        }}
                        isDisabled={selected[path.floodpath_id] === "Dismiss"}
                      />
                    </div>
                  </div>
                </>
              );
            })}
          </div>
        </AlertDialogue>
      )}

      <div
        className={cn(
          role === "admin"
            ? `flex justify-center w-full`
            : `flex justify-center w-full pt-13`,
        )}
      >
        <div className="relative max-w-md w-full">
          <MapContainer
            id="Map_Container"
            style={{ height: "94vh", width: "100%" }}
            maxBounds={philippinesBounds}
            maxBoundsViscosity={1.0}
            minZoom={6}
            ref={mapRef}
          >
            <MapComp
              onLocationFound={setLocationFound}
              showLocation={showLocation}
              nearestRouteTrigger={showNearestRouteTrigger}
            />
          </MapContainer>
          {/* <div className="fixed w-full max-w-md"> */}
          <div
            className="absolute top-0 left-0 w-full pointer-events-none z-[1000]"
            style={{ height: "94vh" }}
          >
            <div className="flex justify-end px-4 pt-4">
              <div className="pointer-events-auto">
                <span>
                  <Filter />
                </span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full flex justify-center items-center pointer-events-none">
            <div className="flex flex-col w-full max-w-md items-center justify-center mb-8 pointer-events-auto">
              <CurrentLocation
                className="w-14 h-14 self-end m-4 drop-shadow-xl"
                onClick={() => setShowLocation((prev) => !prev)}
              />

              <div className="w-full flex flex-col items-center gap-2 ">
                <div className="bg-gray-400/40 rounded-xl h-fit w-4/5 text-center p-1">
                  <p className="text-sm">
                    {role
                      ? "Press anywhere on the map"
                      : "Guest Mode - View only"}
                  </p>
                </div>
                <ButtonComp
                  text="Find Nearest Evac Center"
                  variant="important"
                  id="Map_NearestRouteBtn"
                  onClick={handleNearestRoute}
                  widthSize="90%"
                  heightSize="50px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Map;
