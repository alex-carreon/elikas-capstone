import type { ReactNode } from "react";

import "../App.css";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import colors from "@/constants/colors";

interface CheckBoxProps {
  text: ReactNode;
  id: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  readOnly?: boolean;
}

function CheckBox({
  text,
  id,
  checked,
  onCheckedChange,
  readOnly,
}: CheckBoxProps) {
  return (
    <div className="flex flex-col">
      <Field orientation="horizontal">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          readOnly={readOnly}
        />
        <Label className={"text-xs w-auto"} style={{ color: colors.label }}>
          {text}
        </Label>
      </Field>
    </div>
  );
}

export default CheckBox;
