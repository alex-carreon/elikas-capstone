import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "react-router";
import FormLayout from "./Forms/FormLayout";
import api from "@/api";
import { useState, useEffect } from "react";
import { Fragment } from "react";
import Row from "@/components/Row";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type commentedBy = {
  id: number;
  username: string;
};

type comment = {
  id: number;
  content: string;
  commented_by: commentedBy;
  posted_at: string;
  is_deactivated: boolean;
  media: string[];
};

function EvacComments() {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<comment[]>([]);
  const [openCollapse, setOpenCollapse] = useState(false);

  const { pinId } = useParams();

  const getComments = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/admin/evac-areas/${pinId}/comments`, {
        signal,
      });
      setComments(response.data.comments);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      await getComments(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAll();
  }, []);

  return (
    <>
      <FormLayout formTitle={`Evacuation Pin ${pinId} Comments`}>
        {loading ? (
          <>
            <div className="w-full flex flex-col items-center">
              <div className="flex w-full max-w-sm flex-col gap-7 pt-4">
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-24 w-full bg-[#59260B]/30" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-24 w-full bg-[#59260B]/30" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-24 w-full bg-[#59260B]/30" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <Fragment key={index}>
                  <div>
                    <Row
                      postId={String(comment.id)}
                      title={
                        comment.content
                          ? `Content: ${comment.content}`
                          : "No Content attached"
                      }
                      desc={`Commented by: ${comment.commented_by.username}`}
                      datePosted={comment.posted_at}
                      link={`/admin-pins/comments/${comment.id}`}
                      showBtn
                    ></Row>
                    {comment.media.length > 0 && (
                      <Collapsible className="rounded-sm data-[state=open]:bg-red p-1 outline">
                        <CollapsibleTrigger
                          id="Drawer_FacilitiesTrigger"
                          className="group w-full flex flex-col items-start"
                          onClick={() => {
                            setOpenCollapse(!openCollapse);
                          }}
                        >
                          <div className="flex flex-row items-center">
                            See Attached Media
                            {openCollapse ? (
                              <ChevronUpIcon className="ml-auto group-data-[state=open]:rotate-180" />
                            ) : (
                              <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {comment.media.map((media) => (
                            <img src={media} />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </Fragment>
              ))
            ) : (
              <p className="text-center">No Comments yet!</p>
            )}
          </div>
        )}
      </FormLayout>
    </>
  );
}

export default EvacComments;
