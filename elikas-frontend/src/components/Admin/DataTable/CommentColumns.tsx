import ButtonComp from "@/components/Button";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useNavigate } from "react-router";

type commentedBy = {
  id: number;
  username: string;
};

export type comment = {
  id: number;
  content: string;
  commented_by: commentedBy;
  posted_at: string;
  is_deactivated: boolean;
  media: string[];
};

function ActionsCell({ row }: { row: Row<comment> }) {
  const navigate = useNavigate();
  return (
    <div className="pointer-events-auto">
      <ButtonComp
        text="View Details"
        variant="important"
        id="Admin_ActiveIndivDetailsBtn"
        onClick={() => navigate(`/admin-pins/comments/${row.original.id}`)}
      />
    </div>
  );
}

export const CommentColumns: ColumnDef<comment>[] = [
  { accessorKey: "id", header: "Comment ID" },
  { accessorKey: "content", header: "Content" },
  { accessorKey: "commented_by.username", header: "User" },
  { accessorKey: "posted_at", header: "Posted at" },
  {
    accessorKey: "media",
    header: "Attached Media",
    cell: ({ row }) => {
      const media = row.original.media;

      if (!media || media.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <div className="flex items-center gap-1">
          {media.slice(0, 3).map((item, index) => (
            <img
              key={index}
              src={typeof item === "string" ? item : item}
              alt={`Attachment ${index + 1}`}
              className="h-8 w-8 rounded object-cover"
            />
          ))}
          {media.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{media.length - 3}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
