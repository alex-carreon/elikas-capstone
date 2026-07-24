import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import ButtonComp from "@/components/Button";
import { cn } from "@/lib/utils";

export type Hazards = {
  id: number;
  description: string;
  level: string;
  posted_at: string;
  is_expired: boolean;
  is_deactivated: boolean;
  is_user_deactivated: boolean;
};

function ActionsCell({ row }: { row: Row<Hazards> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_ActiveIndivDetailsBtn"
        onClick={() => navigate(`/admin-hazardDetails/${row.original.id}`)}
      />
    </div>
  );
}

export const HazColumns: ColumnDef<Hazards>[] = [
  { accessorKey: "id", header: "Pin ID" },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "level",
    header: "Flood Level",
    cell: ({ getValue }) => {
      const value = getValue() as string;

      return (
        <div
          className={cn(
            value === "Gutter-Deep" || value === "Half Knee-Deep"
              ? "py-1 px-2 bg-[#52B2DA] rounded-sm text-center"
              : value === "Half Tire-Deep" || value === "Knee-Deep"
                ? "py-1 px-2 bg-[#578EC2] rounded-sm text-center text-white"
                : value === "Tire-Deep" ||
                    value === "Waist-Deep" ||
                    value === "Chest-Deep"
                  ? "py-1 px-2 bg-[#B22B42] rounded-sm text-center text-white"
                  : "py-1 px-2 bg-[#C7C7C7] rounded-sm text-center",
          )}
        >
          {value}
        </div>
      );
    },
  },
  {
    accessorKey: "posted_at",
    header: "Posted at",
  },
  {
    accessorKey: "is_expired",
    header: "Expiry Status",
    cell: ({ getValue }) => (
      <div
        className={cn(
          getValue()
            ? "py-1 px-2 bg-red-300 rounded-sm text-center"
            : "py-1 px-2 bg-green-300 rounded-sm text-center",
        )}
      >
        {getValue() ? "Expired" : "Active"}
      </div>
    ),
  },
  {
    accessorKey: "is_deactivated",
    header: "Deactivation Status",
    cell: ({ getValue }) => (
      <div
        className={cn(
          getValue()
            ? "py-1 px-2 bg-red-300 rounded-sm text-center"
            : "py-1 px-2 bg-green-300 rounded-sm text-center",
        )}
      >
        {getValue() ? "Deactivated" : "Active"}
      </div>
    ),
  },
  {
    accessorKey: "is_user_deactivated",
    header: "User Status",
    cell: ({ getValue }) => (
      <div
        className={cn(
          getValue()
            ? "py-1 px-2 bg-red-300 rounded-sm text-center"
            : "py-1 px-2 bg-green-300 rounded-sm text-center",
        )}
      >
        {getValue() ? "Deactivated" : "Active"}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
