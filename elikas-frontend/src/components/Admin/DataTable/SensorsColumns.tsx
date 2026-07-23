import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import ButtonComp from "@/components/Button";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type SensorsDetails = {
  id: number;
  sensorCode: string;
  name: string;
  waterLevel: any | null;
  lastOnline: any | null;
  mountHeight: number;
  location: [number, number];
  address: string;
  yellowLevel: number;
  redLevel: number;
  currentStatus: string;
  mountLocation: string;
  deactivatedAt: any | null;
  registeredBy: string;
};

function ActionsCell({ row }: { row: Row<SensorsDetails> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_ActiveIndivDetailsBtn"
        onClick={() => navigate(`/admin-sensorDetails/${row.original.id}`)}
      />
    </div>
  );
}

const convertDateTime = (utcString: string) => {
  const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
  return format(zoned, "MMM d, yyyy h:mm a");
};

export const SensorsColumns: ColumnDef<SensorsDetails>[] = [
  { accessorKey: "sensorCode", header: "Sensor Code" },
  { accessorKey: "name", header: "Sensor Name" },
  { accessorKey: "address", header: "Address" },
  {
    accessorKey: "currentStatus",
    header: "Status",
    cell: ({ getValue }) => {
      const value = getValue() as string;

      return (
        <div
          className={cn(
            value === "normal"
              ? "py-1 px-2 bg-green-700/60 rounded-sm text-center"
              : value === "yellow"
                ? "py-1 px-2 bg-yellow-700/60 rounded-sm text-center text-white"
                : value === "orange"
                  ? "py-1 px-2 bg-amber-700/60 rounded-sm text-center text-white"
                  : value === "red"
                    ? "py-1 px-2 bg-red-700/60 rounded-sm text-center text-white"
                    : "py-1 px-2 bg-[#C7C7C7] rounded-sm text-center",
          )}
        >
          {value}
        </div>
      );
    },
  },
  {
    accessorKey: "lastOnline",
    header: "Last Online",
    cell: ({ getValue }) => {
      const lastOnline = getValue() as string;
      return (
        <div>
          {getValue() ? convertDateTime(lastOnline) : "Not yet installed"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
