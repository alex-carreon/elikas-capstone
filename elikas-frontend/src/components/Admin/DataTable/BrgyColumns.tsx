import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import ButtonComp from "@/components/Button";

export type BrgyUser = {
  id: number;
  location: string;
  parent_location: string;
  name: string;
  role: string;
};

function ActionsCell({ row }: { row: Row<BrgyUser> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_ActiveIndivDetailsBtn"
        onClick={() => navigate(`/admin-brgyDetails/${row.original.id}`)}
      />
    </div>
  );
}

export const BrgyColumns: ColumnDef<BrgyUser>[] = [
  { accessorKey: "id", header: "User ID" },
  { accessorKey: "location", header: "Name" },
  { accessorKey: "parent_location", header: "Address" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
