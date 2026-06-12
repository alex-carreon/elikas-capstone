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

type flagInfo = {
  type: string;
  flag_count: number;
  reasons: reason[];
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
  is_deactivated: boolean;
  media: string[];
  flag_info: flagInfo;
};

function FlaggedCommentDetails() {
  const [loading, setLoading] = useState(false);
  const [flagDetails, setFlagDetails] = useState<flagDetails>();

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
      await getFlaggedDetails(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  const ignoreFlag = (e?: React.FormEvent) => {
    e?.preventDefault();

    try {
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
      response.then(() => {
        navigate("/admin-pins");
      });
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  const rejectFlag = (e?: React.FormEvent) => {
    e?.preventDefault();

    try {
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
      response.then(() => {
        navigate("/admin-pins");
      });
    } catch (err: any) {
      console.log(err.response.data);
    }
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
      >
        {loading ? (
          <div className="flex justify-center">
            <FormSkeleton />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <TextField
                label="Flag Type"
                value={String(flagDetails?.flag_info.type)}
                inputType="text"
                id="Admin_FlaggedPathType"
                readonly
              />
              <TextField
                label="Flag Count"
                value={String(flagDetails?.flag_info.flag_count)}
                inputType="text"
                id="Admin_FlaggedPathCount"
                readonly
              />
              {flagDetails?.flag_info.reasons.map((reason) => (
                <div className="flex gap-2">
                  <TextField
                    label="Flag Reason"
                    value={reason.reason}
                    inputType="text"
                    id="Admin_FlaggedPathReason"
                    readonly
                  />
                  <TextField
                    label="Count"
                    value={String(reason.flag_count)}
                    inputType="text"
                    id="Admin_FlaggedPathReasonCount"
                    readonly
                  />
                </div>
              ))}

              <TextField
                label="Flood Path Id"
                value={String(flagDetails?.id)}
                inputType="text"
                id="Admin_FlaggedPathId"
                readonly
              />
              <TextField
                label="Element Id"
                value={String(flagDetails?.element_id)}
                inputType="text"
                id="Admin_FlaggedPathElementId"
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
                label="Posted By"
                value={String(flagDetails?.posted_by.username)}
                inputType="text"
                id="Admin_FlaggedPathPostedBy"
                readonly
              />
              <div className="flex gap-2">
                <TextField
                  label="Upvotes"
                  value={String(flagDetails?.upvotes)}
                  inputType="text"
                  id="Admin_FlaggedPathUpvotes"
                  readonly
                />
                <TextField
                  label="Downvotes"
                  value={String(flagDetails?.downvotes)}
                  inputType="text"
                  id="Admin_FlaggedPathDownvotes"
                  readonly
                />
              </div>
              <div className="flex flex-col gap-1">
                <TextField
                  label="Posted at"
                  value={String(flagDetails?.posted_at)}
                  inputType="text"
                  id="Admin_FlaggedPathExpiry"
                  readonly
                />
                <div className="flex gap-4">
                  <p className="text-xs italic" id="Admin_FlaggedIsDeac">
                    Has deactivated: {String(flagDetails?.is_deactivated)}
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
