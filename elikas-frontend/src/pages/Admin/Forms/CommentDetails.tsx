import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import FormLayout from "./FormLayout";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import api from "@/api";
import TextField from "@/components/TextField";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";

type evacArea = {
  id: number;
  name: string;
};

type postedBy = {
  id: number;
  username: string;
};

type commentDetail = {
  id: number;
  evac_area: evacArea;
  posted_by: postedBy;
  content: string;
  upvotes: number;
  downvotes: number;
  posted_at: string;
  is_deactivated: boolean;
  media: string[];
};

function CommentDetails() {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState<commentDetail>();
  const [disabled, setDisabled] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

  const commentDetails = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/admin/comments/${id}`, { signal });
      setComment(response.data.comment);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      setDisabled(true);
      await commentDetails(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    } finally {
      setLoading(false);
      setDisabled(false);
    }
    return () => controller.abort();
  };

  const delComment = async () => {
    setDisabled(true);
    const response = api.patch(`/admin/comments/${comment?.id}/deactivate`);

    toast.promise(response, {
      loading: "Deactivating this comment...",
      success: "Comment deactivated!",
      error: "Deleting unsuccessful. Please try again",
      position: "top-center",
    });

    response
      .then(() => {
        navigate(`/admin-pins/${comment?.evac_area.id}/comments`);
      })
      .catch((err: any) => {
        console.log(err.response.message);
        toast.error(
          "An unexpected error occurred. Please wait while the team tries to fix this!",
        );
      })
      .finally(() => setDisabled(false));
  };

  useEffect(() => {
    getAll();
  }, []);

  return (
    <>
      <FormLayout
        formTitle="Comment Details"
        deleteId="Admin_EvacCommentDelete"
        deleteClick={() => delComment()}
        isDisabled={disabled}
        isDeactivated={comment?.is_deactivated}
      >
        {loading ? (
          <div className="flex justify-center">
            <FormSkeleton />
          </div>
        ) : (
          <>
            <TextField
              label="Comment ID"
              value={String(comment?.id)}
              inputType="text"
              id="Admin_EvacCommentId"
              readonly
            />
            <Field>
              <FieldLabel>Evacuation Pin Commented</FieldLabel>
              <div className="flex flex-row gap-2">
                <TextField
                  label="Evacuation Pin ID"
                  value={String(comment?.evac_area.id)}
                  inputType="text"
                  id="Admin_EvacCommentPinId"
                  readonly
                />
                <TextField
                  label="Evacuation Pin Name"
                  value={String(comment?.evac_area.name)}
                  inputType="text"
                  id="Admin_EvacCommentPinName"
                  readonly
                />
              </div>
            </Field>
            <TextField
              label="Content"
              value={comment?.content}
              inputType="text"
              id="Admin_EvacCommentContent"
              readonly
            />
            <Field>
              <FieldLabel>Media Attached</FieldLabel>
              {comment?.media && comment.media.length > 0 ? (
                comment?.media.map((media) => (
                  <img src={media} id="Admin_EvacCommentMedia" />
                ))
              ) : (
                <p>No Media Attached</p>
              )}
            </Field>

            <div className="flex flex-row gap-2">
              <TextField
                label="Upvotes"
                value={String(comment?.upvotes)}
                inputType="text"
                id="Admin_EvacCommentUpvotes"
                readonly
              />
              <TextField
                label="Downvotes"
                value={String(comment?.downvotes)}
                inputType="text"
                id="Admin_EvacCommentDownvotes"
                readonly
              />
            </div>
            <div>
              <TextField
                label="Posted at"
                value={comment?.posted_at}
                inputType="text"
                id="Admin_EvacCommentPostedAt"
                readonly
              />
              <p className="text-xs italic" id="Admin_EvacCommentHasDeac">
                Has deactivated: {String(comment?.is_deactivated)}
              </p>
            </div>
          </>
        )}
      </FormLayout>
    </>
  );
}

export default CommentDetails;
