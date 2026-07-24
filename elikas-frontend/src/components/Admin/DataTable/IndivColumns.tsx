import ButtonComp from "@/components/Button";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";

export type IndivUsers = {
  id: number;
  name: string;
  location: string;
  role: string;
};

function ActionsCell({ row }: { row: Row<IndivUsers> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_ActiveIndivDetailsBtn"
        onClick={() => navigate(`/admin-userDetails/${row.original.id}`)}
      />
    </div>
  );
}
export const IndivColumns: ColumnDef<IndivUsers>[] = [
  { accessorKey: "id", header: "User ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "location", header: "Address" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
