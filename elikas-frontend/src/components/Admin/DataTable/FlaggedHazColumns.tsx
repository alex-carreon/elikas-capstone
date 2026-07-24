import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import ButtonComp from "@/components/Button";

export type FlaggedPaths = {
  flag_id: number;
  flood_path_id: number;
  element_id: number;
  reason: string;
  flag_count: number;
  flagged_at: string;
};

function ActionsCell({ row }: { row: Row<FlaggedPaths> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_ActiveIndivDetailsBtn"
        onClick={() => navigate(`/admin-flagged/${row.original.flood_path_id}`)}
      />
    </div>
  );
}

export const HazFlaggedColumns: ColumnDef<FlaggedPaths>[] = [
  { accessorKey: "flag_id", header: "Flag ID" },
  { accessorKey: "reason", header: "Reason" },
  {
    accessorKey: "flag_count",
    header: "Total Flags",
  },
  { accessorKey: "flood_path_id", header: "Hazard Pin ID" },
  {
    accessorKey: "flagged_at",
    header: "Flagged at",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
