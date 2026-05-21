import "../App.css";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import colors from "@/constants/colors";

interface CheckBoxProps {
  text: string;
  id: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function CheckBox({ text, id, checked, onCheckedChange }: CheckBoxProps) {
  return (
    <div className="flex flex-col">
      <Field orientation="horizontal">
        <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
        <Label className={"text-xs w-auto"} style={{ color: colors.label }}>
          {text}
        </Label>
      </Field>
    </div>
  );
}

export default CheckBox;
