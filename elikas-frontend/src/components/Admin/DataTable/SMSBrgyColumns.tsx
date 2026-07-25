import { type ColumnDef } from "@tanstack/react-table";

export type SMS = {
  id: number;
  message_content: string;
  status: Status;
  scheduled_for: string;
  sent_at: string | null;
  total_recipients: number;
};

type Status = {
  id: number;
  name: string;
};

export const SMSBrgyColumns: ColumnDef<SMS>[] = [
  { accessorKey: "id", header: "SMS ID" },
  { accessorKey: "message_content", header: "Message" },
  { accessorKey: "total_recipients", header: "Total Recipients" },
  { accessorKey: "status.name", header: "Status" },
  { accessorKey: "scheduled_for", header: "Scheduled Date" },
  {
    accessorKey: "sent_at",
    header: "Sent Date",
    cell: (row) => {
      if (row.row.original.sent_at) {
        return <p>{row.row.original.sent_at}</p>;
      } else {
        return "Not sent yet";
      }
    },
  },
];
