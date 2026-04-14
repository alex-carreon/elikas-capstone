import "../App.css";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

interface CheckBoxProps {
  text: string;
  id: string;
}

function CheckBox({ text, id }: CheckBoxProps) {
  return (
    <div className="flex flex-col self-center ">
      <Field orientation="horizontal">
        <Checkbox id={id} />
        <Label className={"text-xs w-auto"}>{text}</Label>
      </Field>
    </div>
  );
}

export default CheckBox;
