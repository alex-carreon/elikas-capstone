import { Field, FieldContent, FieldLabel, FieldDescription } from "./ui/field";
import { Switch } from "@/components/ui/switch";
import colors from "@/constants/colors";

interface SwitchProps {
  label: string;
  description: string;
  id: string;
}

function SwitchComp({ label, description, id }: SwitchProps) {
  return (
    <Field className="max-w-sm align-center">
      <FieldContent>
        <div className="flex flex-row items-center justify-between">
          <FieldLabel
            className={"text-xl w-s font-bold"}
            style={{ color: colors.activeIcon }}
          >
            {label}
          </FieldLabel>
          <Switch id={id} size="default" />
        </div>
        <FieldDescription className="text-l" style={{ color: colors.heading }}>
          {description}
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}

export default SwitchComp;
