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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import colors from "@/constants/colors";
import { Info } from "lucide-react";

type pathReminder = {
  floodpath_id: number;
  flood_description: string;
  message: string;
  expiry: string;
};

function Map() {
  const [closeAlert, setCloseAlert] = useState(false);
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
  const [showRoute, setShowRoute] = useState(false);
  const [showNearest, setShowNearest] = useState(false);
  const [clearRoute, setClearRoute] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [showOnline, setShowOnline] = useState(false);

  const openDialog = useRef(false);

  // const philippinesBounds: LatLngBoundsExpression = [
  //   [4.5, 116.0], // southwest corner
  //   [21.5, 127.0], // northeast corner
  // ];

  const luzonBounds: LatLngBoundsExpression = [
    [14.28, 120.85], // Southwest
    [14.8, 121.15], // Northeast
  ];

  // const manilaBounds: LatLngBoundsExpression = [
  //   [14.5495, 120.9205], // southwest corner
  //   [14.6434, 121.0343], // northeast corner
  // ];

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
      setShowNearestRouteTrigger((prev) => prev + 1);
    } else toast.error("Please enable location to find a route.");
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
      setDecidedCount((prev) => prev + 1);
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
      setDecidedCount((prev) => prev + 1);
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

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnline(true);
    };
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOffline) {
      setShowOffline(true);
    } else {
      setShowOffline(false);
    }
  }, [isOffline]);

  useEffect(() => {
    if (!showOnline) return;
    const timer = setTimeout(() => setShowOnline(false), 5000);
    return () => clearTimeout(timer);
  }, [showOnline]);

  return (
    <>
      {!role &&
        (closeAlert ? null : (
          <div className="fixed top-18 left-0 right-0 z-20 mx-4 flex justify-center">
            <Alert
              id="NavbarGuest_Alert"
              className="w-full max-w-sm p-4 shadow-lg bg-[#FFF1DD] text-center flex flex-col items-center gap-3 z-["
            >
              {/* <CheckCircle2Icon /> */}
              <AlertTitle
                className="font-bold"
                style={{ color: colors.heading }}
              >
                You are logged out!
              </AlertTitle>
              <AlertDescription style={{ color: colors.heading }}>
                You are now in guest mode. You can still explore the map, but
                you’ll need an account to join the conversation.
              </AlertDescription>
              <Button
                id="NavbarGuest_AlertBtn"
                className="w-2/3"
                onClick={() => setCloseAlert(true)}
              >
                Got it!
              </Button>
            </Alert>
          </div>
        ))}
      {showDownload && !isOffline && (
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
      {showOffline && (
        <>
          <AlertDialogue
            title="You are offline!"
            description="No internet connection. You can still browse, but editing is disabled until you're back online."
            buttonText="Got it!"
            open={isOffline}
            contentId="Map_OfflineContentDialog"
            actionId="Map_CloseOfflineDialog"
            onClick={() => {
              setShowOffline(false);
            }}
          />
        </>
      )}
      {isOffline ? (
        <div className="fixed bottom-0 z-20 w-full">
          <div className="flex w-md justify-self-center">
            <div className="bg-[#D82D24] w-full h-fit text-center p-1">
              <p className="text-sm text-white">You are currently offline</p>
            </div>
          </div>
        </div>
      ) : (
        showOnline && (
          <div className="fixed bottom-0 z-20 w-full">
            <div className="flex w-md justify-self-center">
              <div className="bg-green-600 w-full h-fit text-center p-1">
                <p className="text-sm text-white">You are back online!</p>
              </div>
            </div>
          </div>
        )
      )}
      <div
        className={cn(
          role === "admin"
            ? `flex justify-center w-full`
            : role === "brgy_op"
              ? `flex items-center w-full pt-15 flex-col`
              : `flex justify-center w-full pt-13`,
        )}
      >
        {role === "brgy_op" && (
          <div className="w-full bg-[#5f80aa] h-12 flex flex-row items-center justify-left p-4 gap-2">
            <Info color="white" size="30" strokeWidth={1.5} />
            <p className="text-white text-sm">
              You are accessing eLikas as a Barangay Operator
            </p>
          </div>
        )}
        <div className="relative w-full h-full">
          <MapContainer
            id="Map_Container"
            style={
              role === "brgy_op"
                ? { height: "87dvh", width: "100%" }
                : { height: "93dvh", width: "100%" }
            }
            maxBounds={luzonBounds}
            maxBoundsViscosity={1.0}
            // minZoom={12}
            minZoom={11}
            ref={mapRef}
          >
            <MapComp
              onLocationFound={setLocationFound}
              showLocation={showLocation}
              nearestRouteTrigger={showNearestRouteTrigger}
              setNearestRoute={setShowNearest}
              setRoute={setShowRoute}
              clearRoute={clearRoute}
              setClearRoute={setClearRoute}
            />
          </MapContainer>
          {/* <div className="fixed w-full max-w-md"> */}
          {role ? (
            <div
              className="absolute top-0 left-0 w-full pointer-events-none z-[1000]"
              style={{ height: "100%" }}
            >
              <div
                className={cn(
                  role === "brgy_op"
                    ? "flex flex-col justify-end px-4"
                    : "flex flex-col justify-end px-4 pt-4",
                )}
              >
                <div className="pointer-events-auto">
                  <span>
                    <Filter />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            closeAlert && (
              <>
                <div
                  className="absolute top-0 left-0 w-full pointer-events-none z-[1000]"
                  style={{ height: "100%" }}
                >
                  <div className="flex flex-col justify-end px-4 pt-4">
                    <div className="pointer-events-auto">
                      <span>
                        <Filter />
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )
          )}
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
                {showNearest || showRoute ? (
                  <ButtonComp
                    text="Clear Route"
                    variant="important"
                    id="Map_ClearRouteBtn"
                    onClick={() => setClearRoute(true)}
                    widthSize="90%"
                    heightSize="50px"
                  />
                ) : (
                  <ButtonComp
                    text="Find Nearest Evac Center"
                    variant="important"
                    id="Map_NearestRouteBtn"
                    onClick={handleNearestRoute}
                    widthSize="90%"
                    heightSize="50px"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Map;
