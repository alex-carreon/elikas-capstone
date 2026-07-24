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
import { DataTable } from "@/components/Admin/DataTable/DataTable";
import {
  CommentColumns,
  type comment,
} from "@/components/Admin/DataTable/CommentColumns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function EvacComments() {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<comment[]>([]);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [openCommentId, setOpenCommentId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);

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

    return () => controller.abort();
  };

  useEffect(() => {
    getAll();
  }, []);

  return (
    <>
      <FormLayout formTitle={`Evacuation Pin ${pinId} Comments`}>
        <div className="w-full flex flex-col items-center">
          <Tabs
            defaultValue="overview"
            className="w-full max-w-md flex items-center"
          >
            <TabsList className="w-full flex justify-between">
              <TabsTrigger
                value="Active Hotlines"
                onClick={() => {
                  setIsActive(true);
                }}
                id="Admin_HotlinesActiveTrigger"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="Inactive Hotlines"
                onClick={() => {
                  setIsActive(false);
                }}
                id="Admin_HotlinesInactiveTrigger"
              >
                Deactivated
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {loading ? (
          <>
            <div className="w-full flex flex-col items-center">
              <div className="flex w-full flex-col gap-7 pt-4">
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
        ) : isActive ? (
          <>
            <div className="hidden md:block px-8">
              <DataTable
                columns={CommentColumns}
                data={comments.filter((comment) => !comment.is_deactivated)}
              />
            </div>
            <div className="md:hidden">
              <div className="flex flex-col gap-2">
                {comments.length > 0 ? (
                  comments.map((comment, index) => {
                    if (!comment.is_deactivated)
                      return (
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
                              buttonId="Admin_EvacComments"
                              showBtn
                            ></Row>
                            {comment.media.length > 0 && (
                              <Collapsible
                                className="rounded-sm data-[state=open]:bg-red p-1 outline"
                                open={openCommentId === comment.id}
                                onOpenChange={(isOpen) =>
                                  setOpenCommentId(isOpen ? comment.id : null)
                                }
                              >
                                <CollapsibleTrigger
                                  id="Admin_EvacCommentsMediaTrigger"
                                  className="group w-full flex flex-col items-start"
                                  onClick={() => {
                                    setOpenCollapse(!openCollapse);
                                  }}
                                >
                                  <div className="flex flex-row items-center">
                                    See Attached Media
                                    {openCommentId === comment.id ? (
                                      <ChevronUpIcon className="ml-auto group-data-[state=open]:rotate-180" />
                                    ) : (
                                      <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                                    )}
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  {comment.media.map((media) => (
                                    <img
                                      src={media}
                                      id="Admin_EvacCommentsMedia"
                                    />
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        </Fragment>
                      );
                  })
                ) : (
                  <p className="text-center">No Comments yet!</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="hidden md:block px-8">
              <DataTable
                columns={CommentColumns}
                data={comments.filter((comment) => comment.is_deactivated)}
              />
            </div>
            <div className="md:hidden">
              <div className="flex flex-col gap-2">
                {comments.length > 0 ? (
                  comments.map((comment, index) => {
                    if (comment.is_deactivated)
                      return (
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
                              buttonId="Admin_EvacComments"
                              showBtn
                            ></Row>
                            {comment.media.length > 0 && (
                              <Collapsible
                                className="rounded-sm data-[state=open]:bg-red p-1 outline"
                                open={openCommentId === comment.id}
                                onOpenChange={(isOpen) =>
                                  setOpenCommentId(isOpen ? comment.id : null)
                                }
                              >
                                <CollapsibleTrigger
                                  id="Admin_EvacCommentsMediaTrigger"
                                  className="group w-full flex flex-col items-start"
                                  onClick={() => {
                                    setOpenCollapse(!openCollapse);
                                  }}
                                >
                                  <div className="flex flex-row items-center">
                                    See Attached Media
                                    {openCommentId === comment.id ? (
                                      <ChevronUpIcon className="ml-auto group-data-[state=open]:rotate-180" />
                                    ) : (
                                      <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                                    )}
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  {comment.media.map((media) => (
                                    <img
                                      src={media}
                                      id="Admin_EvacCommentsMedia"
                                    />
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        </Fragment>
                      );
                  })
                ) : (
                  <p className="text-center">No Comments yet!</p>
                )}
              </div>
            </div>
          </>
        )}
      </FormLayout>
    </>
  );
}

export default EvacComments;
