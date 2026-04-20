import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "./ui/field";
import colors from "@/constants/colors";

interface SelectDropdownProps {
  value: string;
  onValueChange: (val: string) => void;
  label: string;
  id: string;
  placeholder: string;
  onSubmit?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  options: { label: string; value: string }[];
}

function SelectDropdown({
  label,
  id,
  placeholder,
  error,
  onValueChange,
  options,
  value,
  onSubmit,
}: SelectDropdownProps) {
  return (
    <Field>
      <FieldLabel className={"text-sm w-s"} style={{ color: colors.label }}>
        {label}
      </FieldLabel>
      <Select onValueChange={(val: string | null) => onValueChange(val ?? "")}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </Field>
  );
}

export default SelectDropdown;
