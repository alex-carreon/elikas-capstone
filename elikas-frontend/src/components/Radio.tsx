import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Field } from "@/components/ui/field";

interface RadioProps {
  options: { label: string; value: string }[];
  isRequired: boolean;
  onValueChange: (val: string) => void;
  onSubmit?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Radio({ options, isRequired, onValueChange, onSubmit }: RadioProps) {
  return (
    <Field>
      <RadioGroup
        required={isRequired}
        onValueChange={(val: string | null) => onValueChange(val ?? "")}
      >
        <div className="flex items-start flex-col gap-3">
          {options.map((option) => (
            <div className="flex gap-2">
              <RadioGroupItem key={option.value} value={option.value} />
              <Label className="font-medium">{option.label}</Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </Field>
  );
}

export default Radio;
