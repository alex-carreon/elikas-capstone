import { type ColumnDef } from "@tanstack/react-table";

export type SMS = {
  id: number;
  message_content: string;
  status: Status;
  scheduled_for: string;
  sent_at: string | null;
  total_recipients: number;
  sender: Sender;
  location: Location;
};

type Status = {
  id: number;
  name: string;
};

type Sender = {
  govop_id: number;
  user_id: number;
  username: string;
  point_person: string;
  point_position: string;
};

type Location = {
  id: number;
  name: string;
};

export const SMSColumns: ColumnDef<SMS>[] = [
  { accessorKey: "id", header: "SMS ID" },
  { accessorKey: "message_content", header: "Message" },
  { accessorKey: "total_recipients", header: "Total Recipients" },
  {
    accessorFn: (row) =>
      `${row.sender.point_person} - ${row.sender.point_position}`,
    header: "Sender",
  },
  { accessorKey: "sender.username", header: "Sent from" },
  { accessorKey: "status.name", header: "Status" },
];
