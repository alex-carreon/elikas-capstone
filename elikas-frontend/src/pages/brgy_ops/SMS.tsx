import AlertDialogue from "@/components/AlertDialogue";
import ButtonComp from "@/components/Button";
import CheckBox from "@/components/CheckBox";
import TextField from "@/components/TextField";
import { Textarea } from "@/components/ui/textarea";
import colors from "@/constants/colors";
import { useState } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import SelectDropdown from "@/components/SelectDropdown";

function SMS() {
  const [addTemplate, setAddTemplate] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState({ title: "", message: "" });

  const tempalates = [
    {
      id: "1",
      templateTitle: "sample title 1",
      message: "Mga trends na di ko inadapt",
    },
    {
      id: "2",
      templateTitle: "sample title 2",
      message: "Sample title two whattf is burikak",
    },
  ];

  const handleTemplateAdd = () => {
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

    console.log(templateTitle);
    console.log(message);
  };

  const handleSend = () => {
    console.log(message);
  };

  const handleClear = () => {
    setMessage("");
    setTemplateTitle("");
    setTemplateId("");
  };

  const templateMessage = tempalates.find(
    (message) => String(message.id) === String(templateId),
  );

  return (
    <>
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
          onClick={handleTemplateAdd}
        >
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
              readOnly
            />
            <p className="text-xs text-red-500">{error.message}</p>
          </Field>
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
              Send verified announcements to registered contacts instantly.{" "}
            </p>
          </div>
          <div className="w-full max-w-sm flex flex-col gap-4">
            <SelectDropdown
              value={templateId}
              onValueChange={setTemplateId}
              label="Templates"
              placeholder="Choose a template to use"
              id="SMS_SelectTemplateField"
              onSubmit={(e) => setTemplateId(e.target.value)}
              options={tempalates.map((item) => ({
                label: item.templateTitle,
                value: item.id,
              }))}
            />
            <div>
              <p className="font-semibold text-xs">Message (Max Words: 1000)</p>
              <div>
                <p
                  className="italic text-xs justify-self-end"
                  style={{ color: colors.label }}
                >
                  Word Count: 23
                </p>
              </div>
              <Textarea
                className="mt-2 h-100 text-xs"
                placeholder="Place your text message here"
                onChange={(e) => setMessage(e.target.value)}
                value={templateId && templateMessage?.message}
              />
            </div>
          </div>
          <div className="w-full">
            <div className="flex justify-between">
              <ButtonComp
                id="SMS_ClearBtn"
                text="Clear"
                variant="outline"
                heightSize="30px"
                widthSize="70px"
                onClick={handleClear}
              />
              <ButtonComp
                id="SMS_AddTemplateBtn"
                text="Add to Templates"
                variant="outline"
                heightSize="30px"
                widthSize="140px"
                onClick={() => setAddTemplate(!addTemplate)}
                isDisabled={!!templateId}
              />
            </div>
          </div>
          <ButtonComp
            id="SMS_SendBtn"
            text="Send Text"
            variant="primary"
            heightSize="38px"
            widthSize="100%"
            onClick={handleSend}
          />
        </div>
      </div>
    </>
  );
}

export default SMS;
