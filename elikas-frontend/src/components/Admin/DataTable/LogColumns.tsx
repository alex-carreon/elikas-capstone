import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import ButtonComp from "@/components/Button";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export type log = {
  id: number;
  logId: string;
  userType: string;
  userName: string;
  activity: string;
  table: string;
  actionDate: string;
};

function ActionsCell({ row }: { row: Row<log> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_LogsShowDetails"
        onClick={() => navigate(`/admin-logs/${row.id}`)}
      />
    </div>
  );
}

const convertDateTime = (utcString: string) => {
  const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
  return format(zoned, "MMM d, yyyy h:mm a");
};

export const LogColumns: ColumnDef<log>[] = [
  { accessorKey: "id", header: "Log ID" },
  {
    accessorFn: (row) => `${row.activity} at ${row.table}`,
    header: "Activity",
  },
  {
    accessorFn: (row) =>
      `${row.userName} - ${row.userType ? row.userType : "admin"}`,
    header: "User",
  },
  {
    accessorKey: "actionDate",
    header: "Date",
    cell: ({ getValue }) => {
      const date = getValue() as string;
      return <div>{convertDateTime(date)}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
