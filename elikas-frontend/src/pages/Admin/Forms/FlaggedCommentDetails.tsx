import api from "@/api";
import FormLayout from "./FormLayout";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import TextField from "@/components/TextField";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";

type evacArea = {
  id: number;
  name: string;
  evac_deactivated: boolean;
};

type postedBy = {
  id: number;
  username: string;
};

type reason = {
  reason: string;
  flag_count: number;
  first_flagged_at: number;
};

type manual = {
  flag_count: number;
  reasons: reason[];
};

type aiModeration = {
  id: number;
  flagged_at: string;
};

type flagInfo = {
  manual: manual;
  flag_count: number;
  ai_moderation: aiModeration[];
};

type flagDetails = {
  id: number;
  element_id: number;
  evac_area: evacArea;
  posted_by: postedBy;
  content: string;
  upvotes: number;
  downvotes: number;
  posted_at: string;
  media: string[];
  flag_info: flagInfo;
};

function FlaggedCommentDetails() {
  const [loading, setLoading] = useState(false);
  const [flagDetails, setFlagDetails] = useState<flagDetails>();
  const [disabled, setDisabled] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

  const getFlaggedDetails = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/admin/comments/flags/${id}`, { signal });
      setFlagDetails(response.data.comment);
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

      await getFlaggedDetails(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        setDisabled(false);
        return;
      }
      console.log(err);
    } finally {
      setLoading(false);
      setDisabled(false);
    }

    return () => controller.abort();
  };

  const ignoreFlag = (e?: React.FormEvent) => {
    e?.preventDefault();

    setDisabled(true);
    const response = api.patch(
      `/admin/flags/${flagDetails?.element_id}/approve`,
    );
    console.log(response);
    toast.promise(response, {
      loading: "Removing the flag...",
      success: "Flag removed!",
      error: (err: any) => {
        return err.response.data;
      },
      position: "top-center",
    });
    response
      .then(() => {
        navigate("/admin-pins");
      })
      .catch((err: any) => {
        console.log(err.response.data);
      })
      .finally(() => setDisabled(false));
  };

  const rejectFlag = (e?: React.FormEvent) => {
    e?.preventDefault();

    setDisabled(true);

    const response = api.patch(
      `/admin/flags/${flagDetails?.element_id}/reject`,
    );
    console.log(response);
    toast.promise(response, {
      loading: "Accepting the flag and deleting the post...",
      success: "Post removed!",
      error: (err: any) => {
        return err.response.data;
      },
      position: "top-center",
    });
    response
      .then(() => {
        navigate("/admin-pins");
      })
      .catch((err: any) => {
        console.log(err.response.data);
      })
      .finally(() => setDisabled(false));
  };

  useEffect(() => {
    getAll();
  }, []);

  return (
    <>
      <FormLayout
        formTitle="Flagged Comment Details"
        updateId="Admin_EvacFlaggedCommentsIgnore"
        deleteId="Admin_EvacFlaggedCommentsReject"
        updBtnLabel="Ignore"
        updateClick={(e) => ignoreFlag(e)}
        deleteClick={(e) => rejectFlag(e)}
        isDisabled={disabled}
      >
        {loading ? (
          <div className="flex justify-center">
            <FormSkeleton />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <TextField
                label="Flag Count"
                value={String(flagDetails?.flag_info.flag_count)}
                inputType="text"
                id="Admin_EvacFlaggedFlagCount"
                readonly
              />

              {flagDetails?.flag_info.manual.reasons.map((reason) => (
                <div className="flex gap-2">
                  <TextField
                    label="Flag Reason"
                    value={reason.reason}
                    inputType="text"
                    id="Admin_EvacFlaggedReason"
                    readonly
                  />
                  <TextField
                    label="Count"
                    value={String(reason.flag_count)}
                    inputType="text"
                    id="Admin_EvacFlaggedReasonCount"
                    readonly
                  />
                </div>
              ))}
              {flagDetails?.flag_info.ai_moderation &&
                flagDetails?.flag_info.ai_moderation.length > 0 && (
                  <TextField
                    label="FlagReason"
                    value="AI Moderator"
                    inputType="text"
                    id="Admin_EvacFlaggedAIMod"
                    readonly
                  />
                )}
              <TextField
                label="Comment Id"
                value={String(flagDetails?.id)}
                inputType="text"
                id="Admin_EvacFlaggedId"
                readonly
              />
              <TextField
                label="Element Id"
                value={String(flagDetails?.element_id)}
                inputType="text"
                id="Admin_EvacFlaggedElementId"
                readonly
              />
              <Field>
                <FieldLabel>Media</FieldLabel>
                {flagDetails?.media && flagDetails?.media.length > 0 ? (
                  flagDetails?.media.map((media) => <img src={media} />)
                ) : (
                  <p>No Media</p>
                )}
              </Field>
              <TextField
                label="Content"
                value={String(flagDetails?.content)}
                inputType="text"
                id="Admin_EvacFlaggedContent"
                readonly
              />
              <TextField
                label="Posted By"
                value={String(flagDetails?.posted_by.username)}
                inputType="text"
                id="Admin_EvacFlaggedPostedBy"
                readonly
              />
              <div className="flex gap-2">
                <TextField
                  label="Upvotes"
                  value={String(flagDetails?.upvotes)}
                  inputType="text"
                  id="Admin_EvacFlaggedUpvotes"
                  readonly
                />
                <TextField
                  label="Downvotes"
                  value={String(flagDetails?.downvotes)}
                  inputType="text"
                  id="Admin_EvacFlaggedDownvotes"
                  readonly
                />
              </div>
              <div className="flex flex-col gap-1">
                <TextField
                  label="Posted at"
                  value={String(flagDetails?.posted_at)}
                  inputType="text"
                  id="Admin_EvacFlaggedPostedAt"
                  readonly
                />
                <div className="flex gap-4">
                  <p className="text-xs italic" id="Admin_EvacFlaggedIsDeac">
                    Has evacuation pin deactivated:
                    {String(flagDetails?.evac_area.evac_deactivated)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </FormLayout>
    </>
  );
}

export default FlaggedCommentDetails;
