import { type ColumnDef } from "@tanstack/react-table";

type submittedBy = {
  id: number;
  username: string;
  role: string;
};

export type Feedback = {
  id: number;
  rating: number;
  message: string;
  sent_at: string;
  submitted_by: submittedBy;
};

export const FeedbackColumns: ColumnDef<Feedback>[] = [
  { accessorKey: "id", header: "Feedback ID" },
  { accessorKey: "rating", header: "Rating" },
  { accessorKey: "message", header: "Message" },
  { accessorKey: "submitted_by.username", header: "Submitted by" },
  { accessorKey: "sent_at", header: "Sent at" },
];
