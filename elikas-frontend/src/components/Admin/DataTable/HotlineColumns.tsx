import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import ButtonComp from "@/components/Button";

export type Hotline = {
  id: number;
  location_id: number;
  location_name: string;
  name: string;
  address: string;
  phone_number: string;
  mobile_number: string;
  last_updated: string;
  posted_by: string;
  is_deactivated: boolean;
  deactivated_at: string;
};

function ActionsCell({ row }: { row: Row<Hotline> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_ActiveIndivDetailsBtn"
        onClick={() => navigate(`/admin-hotlines/${row.id}`)}
      />
    </div>
  );
}

export const HotlineColumns: ColumnDef<Hotline>[] = [
  { accessorKey: "id", header: "Hotline ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "location_name", header: "Address" },
  { accessorKey: "posted_by", header: "Posted by" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
