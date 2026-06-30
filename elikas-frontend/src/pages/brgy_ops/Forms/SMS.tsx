import AlertDialogue from "@/components/AlertDialogue";
import ButtonComp from "@/components/Button";
import TextField from "@/components/TextField";
import { Textarea } from "@/components/ui/textarea";
import colors from "@/constants/colors";
import { useState, useEffect } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import SelectDropdown from "@/components/SelectDropdown";
import { useNavigate } from "react-router";
import api from "@/api";
import { toast } from "sonner";
import DatePickerInput from "@/components/DateField";
import { format, toZonedTime } from "date-fns-tz";

type templateType = {
  id: number;
  template_name: string;
  message_content: string;
};

function SMS() {
  const [addTemplate, setAddTemplate] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [message, setMessage] = useState<string | undefined>("");
  const [schedSend, setSchedSend] = useState<Date | undefined>(undefined);
  const [error, setError] = useState({ title: "", message: "" });
  const [willDelete, setWillDelete] = useState(false);
  const [templateLoad, setTemplateLoad] = useState(false);
  const [templates, setTemplates] = useState<templateType[]>([]);
  const [recipients, setRecipients] = useState(0);
  const [showDialog, setShowDialog] = useState(true);
  const [smsToken, setSMSToken] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  const navigate = useNavigate();

  const getTemplates = async () => {
    try {
      setTemplateLoad(true);
      const response = await api.get("/sms/templates");
      setTemplates(response.data.templates);
    } catch (err: any) {
      console.log(err.response.data);
    } finally {
      setTemplateLoad(false);
    }
  };

  const handleTemplateAdd = (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateTitle) {
      setError({
        title: "Please enter a title for your template",
        message: "",
      });

      return;
    } else if (!message) {
      setError({
        title: "",
        message: "Please enter your text message before adding as a template",
      });

      return;
    }

    try {
      setDisabled(true);
      const response = api.post("/sms/templates", {
        message_content: message,
        template_name: templateTitle,
      });

      toast.promise(response, {
        loading: "Adding to your templates...",
        success: "Template added!",
        error: (err: any) => {
          if (err.response?.data.error == "Unauthorized") {
            return "Your session has expired. Please log in again.";
          }
          if (
            err.response?.data.details ==
            "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry 'new' for key 'template_name' (Connection: mysql, Host: 100.124.244.40, Port: 3306, Database: elikas_db, SQL: insert into `SMSTemplates` (`optr_id`, `template_name`, `message_content`) values (6, new, bnew))"
          ) {
            return "This title already exists.";
          }
          return "An error occurred. Please try again.";
        },
        position: "top-center",
      });

      getTemplates();
    } catch (err: any) {
      console.log(err.response.data);
      toast.error("An unexpected error occurred");
    } finally {
      setDisabled(false);
    }
  };

  const handleTempleteDel = () => {
    try {
      setDisabled(true);
      const response = api.delete(`/sms/templates/${templateId}`);

      console.log(response);

      toast.promise(response, {
        loading: "Deleting this template...",
        success: "Template deleted!",
        error: (err: any) => {
          if (err.response?.data.error == "Unauthorized") {
            return "Your session has expired. Please log in again.";
          }

          return "An error occurred. Please try again.";
        },
        position: "top-center",
      });

      getTemplates();
    } catch (err: any) {
      toast.error("An unexpected error occurred. Please try again later.");
      console.log(err.response.message);
    } finally {
      setDisabled(false);
    }
  };

  const templateMessage = templates.find(
    (message) => String(message.id) === String(templateId),
  );

  const getRecipientCount = async () => {
    try {
      const response = await api.get("/sms/broadcast-info");
      console.log(response);
      setRecipients(response.data.recipient_count);
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    }
  };

  const handleSendNow = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message) {
      setError({ title: "", message: "This field is required" });
    }

    try {
      setDisabled(true);

      const response = api.post(
        "/sms/broadcasts/send-now",
        { message_content: message },
        {
          headers: {
            "X-iPROG-API-TOKEN": smsToken,
          },
        },
      );

      console.log(response);

      toast.promise(response, {
        loading: "Sending your message now...",
        success: "Message sent!",
        error: (err: any) => {
          if (
            err.response.data.message === "Invalid api token or no load balance"
          ) {
            return "You don't have enough credits! Please check your IPROGSMS account.";
          }

          return "An unexpected error occurred";
        },
        position: "top-center",
      });
    } catch (err: any) {
      if (
        err.response.data.message === "Invalid api token or no load balance"
      ) {
        toast.error(
          "You don't have enough credits! Please check your IPROGSMS account.",
        );
        return;
      }
      toast.error("An unexpected error occurred.");
    } finally {
      setDisabled(false);
    }
  };

  const handleSchedSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (schedSend) {
      const dateTime = format(
        toZonedTime(schedSend, "Asia/Manila"),
        "yyyy-MM-dd HH:mm:ss",
        {
          timeZone: "Asia/Manila",
        },
      );

      try {
        setDisabled(true);
        const response = api.post(
          "/sms-broadcasts/schedule",
          {
            message_content: message,
            scheduled_for: schedSend,
          },
          {
            headers: {
              "X-iPROG-API-TOKEN": smsToken,
            },
          },
        );

        console.log(response);

        toast.promise(response, {
          loading: "Scheduling your message now...",
          success: `Message scheduled! Your message will be sent on ${dateTime}`,
          error: (err: any) => err.response.data.details,
        });
      } catch (err: any) {
        if (
          err.response.data.iprogsms_response.message ===
          "Invalid api token or no load balance"
        ) {
          toast.error(
            "You don't have enough credits! Please check your IPROGSMS account.",
          );
          return;
        }
        if (err.response.data.iprogsms_response.message === "Invalid Token") {
          toast.error("Your token is invalid. Please input it again.");
          return;
        }
        toast.error("An unexpected error occurred.");
      } finally {
        setDisabled(false);
      }
    } else {
      toast.error("You are missing a field.");
      setDisabled(false);
      return;
    }
  };

  const handleClear = () => {
    setMessage("");
    setTemplateTitle("");
    setTemplateId("");
  };

  const handleSubmitToken = (e: React.FormEvent) => {
    e.preventDefault();
    setDisabled(true);
    const response = api.post("/sms/verify-token", {
      api_token: smsToken,
    });

    console.log(response);

    toast.promise(response, {
      loading: "Verifying your token...",
      success: "Token verified!",
      error: (err: any) => {
        setShowDialog(true);
        if (err.response?.data.error == "Unauthorized") {
          return "Your session has expired. Please log in again.";
        }
        if (err.response?.data.message == "Validation failed.") {
          return "Verification failed. Please be sure that the token is from your IPROGSMS account.";
        }
        if (err.response.data.iprogsms_message.message === "Invalid Token") {
          return "The token is invalid. Please check your IPROGSMS account and try again.";
        }
      },
    });

    response
      .then(() => {
        setShowDialog(false);
      })
      .catch((err: any) => {
        setShowDialog(true);
        console.log(err.response.data);
        toast.error("An error ocurred. Please try again.");
      })
      .finally(() => setDisabled(false));
  };

  useEffect(() => {
    if (templateId) {
      setMessage(templateMessage?.message_content);
    }
  }, [templateId]);

  useEffect(() => {
    getTemplates();
    getRecipientCount();
    setShowDialog(true);
  }, []);

  return (
    <>
      {showDialog && (
        <AlertDialogue
          contentId="SMS_TokenContent"
          actionId="SMS_TokenSubmit"
          actionId2="SMS_TokenBack"
          open={showDialog}
          title="IPROGSMS Token"
          description="Enter the IPROGSMS Token provided to you upon registering in their website."
          buttonText="Verify"
          buttonText2="Go Back"
          onClick={(e) => handleSubmitToken(e)}
          onClick2={() => navigate("/map")}
          disabled={disabled}
        >
          <TextField
            label="Verify IPROGSMS Token"
            inputType="text"
            id="SMS_TokenField"
            onSubmit={(e) => setSMSToken(e.target.value)}
          />
          <p className="text-xs text-center pl-4 pr-4">
            <span>Haven't made an account in IPROGSMS yet? </span>
            <a
              href="https://www.iprogsms.com/register"
              className="underline italic"
            >
              Register here!
            </a>
          </p>
        </AlertDialogue>
      )}
      {willDelete && (
        <AlertDialogue
          contentId="SMS_DeacContent"
          closeId="SMS_DeacClose"
          actionId="SMS_DeacBtn"
          open={willDelete}
          title="You are about to delete this SMS template"
          description="Deleting this will remove it your templates permanently."
          buttonText="Delete"
          onClose={() => {
            setWillDelete(false);
          }}
          onClick={handleTempleteDel}
          disabled={disabled}
        />
      )}
      {addTemplate && (
        <AlertDialogue
          contentId="SMS_TemplateContent"
          closeId="SMS_TemplateClose"
          actionId="SMS_AddTemplateBtn"
          open={addTemplate}
          title="Add this to your templates!"
          description="By adding this message to your templates, you can reuse this message again!"
          buttonText="Add to Templates"
          onClose={() => {
            setAddTemplate(false);
            setError({ title: "", message: "" });
          }}
          onClick={(e: any) => handleTemplateAdd(e)}
          disabled={disabled}
        >
          <div className="flex flex-col gap-2 overflow-auto h-fit max-h-[30vh]">
            <TextField
              label="Template Title*"
              placeholder="Enter a title for your message"
              inputType="text"
              id="SMS_TemplateTitleField"
              onSubmit={(e) => setTemplateTitle(e.target.value)}
            />
            <p className="text-xs text-red-500">{error.title}</p>
            <Field>
              <FieldLabel style={{ color: colors.label }}>Message</FieldLabel>
              <Textarea
                className="mt-2 h-80 text-xs"
                value={message}
                placeholder={
                  message
                    ? undefined
                    : "Enter your message first before adding a template"
                }
                id="SMS_TemplateMessageField"
                readOnly
              />
              <p className="text-xs text-red-500">{error.message}</p>
            </Field>
          </div>
        </AlertDialogue>
      )}
      <div className="w-full h-full flex flex-col items-center ">
        <div className="w-full max-w-md pt-12 p-6 mt-8 mb-2 flex flex-col gap-4 items-center">
          <div>
            <p
              className="font-bold text-lg text-center"
              style={{ color: colors.heading }}
            >
              Emergency SMS Broadcast{" "}
            </p>
            <p
              className="text-align text-center italic text-sm"
              style={{ color: colors.label }}
            >
              Send verified announcements to registered contacts instantly.
            </p>
          </div>
          <div className="w-full max-w-sm flex flex-col gap-4">
            <div className="flex w-full h-fit items-center justify-between">
              <div className="w-58 min-w-0 mr-2">
                <SelectDropdown
                  value={templateId}
                  onValueChange={setTemplateId}
                  label="Templates"
                  placeholder="Choose a template to use"
                  id="SMS_SelectTemplateField"
                  onSubmit={(e) => setTemplateId(e.target.value)}
                  options={templates.map((item) => ({
                    label: item.template_name,
                    value: item.id.toString(),
                  }))}
                  clearClick={() => setTemplateId("")}
                  clearId="SMS_TemplateClear"
                  showClear={!!templateId}
                  loading={templateLoad}
                />
              </div>
              <div className="shrink-0">
                <ButtonComp
                  text="SMS History"
                  variant="primary"
                  id="SMS_SMSHistoryBtn"
                  onClick={() => navigate("/SMSHistory")}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-xs">
                  Total Recipients: {recipients}
                </p>
              </div>
              <div className="">
                <p
                  className="italic text-xs justify-self-start"
                  style={{ color: colors.label }}
                >
                  Estimated Price:{" "}
                  {message
                    ? message?.length <= 160
                      ? `P${1 * recipients}`
                      : `P${Math.ceil(message?.length / 153) * recipients}`
                    : "P0"}
                </p>
                <p
                  className="italic text-xs justify-self-end"
                  style={{ color: colors.label }}
                >
                  Character Count: {message?.length} / 160
                </p>
              </div>
              <Textarea
                className="mt-2 h-100 text-xs"
                placeholder="Place your text message here"
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                id="SMS_MessageField"
              />
              <p className="text-xs text-red-500">{error.message}</p>
            </div>
          </div>
          <div className="w-full">
            <div className="flex gap-2">
              <ButtonComp
                id="SMS_ClearBtn"
                text="Clear"
                variant="outline"
                heightSize="30px"
                widthSize="70px"
                onClick={handleClear}
              />
              {!templateId ? (
                <ButtonComp
                  id="SMS_AddTemplateBtn"
                  text="Add to Templates"
                  variant="outline"
                  heightSize="30px"
                  widthSize="140px"
                  onClick={() => setAddTemplate(!addTemplate)}
                />
              ) : null}
            </div>
          </div>
          <DatePickerInput
            label="Schedule Send (Optional)"
            desc="Enter a date and time to send your message."
            idField="SMS_ScheduleDateField"
            idTime="SMS_ScheduleTimeField"
            idBtn="SMS_CalendarBtn"
            showTime
            edit
            timeNow={false}
            onChange={setSchedSend}
            isRequired={schedSend ? true : false}
            value={schedSend}
            clearDate
            clearTime
          />
          <div className="w-full flex flex-col items-center gap-2">
            {schedSend === undefined ? (
              <ButtonComp
                id="SMS_SendBtn"
                text="Send Text"
                variant="primary"
                heightSize="38px"
                widthSize="100%"
                onClick={(e) => handleSendNow(e)}
                isDisabled={disabled}
              />
            ) : (
              <ButtonComp
                id="SMS_SchedBtn"
                text="Schedule Send"
                variant="primary"
                heightSize="38px"
                widthSize="100%"
                onClick={(e) => handleSchedSend(e)}
                isDisabled={disabled}
              />
            )}
            <ButtonComp
              id="SMS_DeleteTemplate"
              text="Delete Template"
              variant="important"
              heightSize="38px"
              widthSize="100%"
              onClick={() => setWillDelete(true)}
              isDisabled={disabled}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default SMS;
