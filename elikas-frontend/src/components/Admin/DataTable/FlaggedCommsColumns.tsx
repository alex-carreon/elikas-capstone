import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import ButtonComp from "@/components/Button";

export type FlaggedComms = {
  moderation_id: number;
  comment_id: number;
  element_id: number;
  content: string;
  manual_count: number;
  moderation_count: number;
  total_flag_count: number;
  evac_deactivated: boolean;
};

function ActionsCell({ row }: { row: Row<FlaggedComms> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_ActiveIndivDetailsBtn"
        onClick={() =>
          navigate(`/admin-flaggedComment/${row.original.comment_id}`)
        }
      />
    </div>
  );
}

export const FlaggedCommsColumns: ColumnDef<FlaggedComms>[] = [
  { accessorKey: "comment_id", header: "Comment ID" },
  { accessorKey: "content", header: "Message" },
  { accessorKey: "total_flag_count", header: "Total Reports" },
  { accessorKey: "manual_count", header: "Manual Reports" },
  { accessorKey: "moderation_count", header: "Moderation Reports" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
