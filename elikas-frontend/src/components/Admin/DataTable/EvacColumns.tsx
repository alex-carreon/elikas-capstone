import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import ButtonComp from "@/components/Button";
import { cn } from "@/lib/utils";

export type EvacPins = {
  id: number;
  name: string;
  address: string;
  is_persistent: boolean;
  expiry: string;
  is_expired: boolean;
  is_deactivated: boolean;
  is_user_deactivated: boolean;
  deactivated_at: string | null;
  posted_at: string;
  my_pin: boolean;
};

function ActionsCell({ row }: { row: Row<EvacPins> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_ActiveIndivDetailsBtn"
        onClick={() => navigate(`/admin-evacDetails/${row.id}`)}
      />
    </div>
  );
}

export const EvacColumns: ColumnDef<EvacPins>[] = [
  { accessorKey: "id", header: "Pin ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "posted_at", header: "Posted at" },
  { accessorKey: "expiry", header: "Expiry Date" },
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
