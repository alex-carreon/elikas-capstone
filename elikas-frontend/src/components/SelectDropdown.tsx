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
import { Spinner } from "./ui/spinner";

interface SelectDropdownProps {
  value: string;
  onValueChange: (val: string) => void;
  label?: string;
  id: string;
  placeholder: string;
  onSubmit?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  options: { label: string; value: string }[];
  isRequired?: boolean;
  disabled?: boolean;
  loading?: boolean;
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
  isRequired,
  disabled,
  loading,
}: SelectDropdownProps) {
  return (
    <Field>
      <div className="flex flex-row items-center gap-2">
        <FieldLabel className={"text-sm w-s"} style={{ color: colors.label }}>
          {label}
        </FieldLabel>
        {loading && <Spinner />}
      </div>
      <Select
        onValueChange={(val: string | null) => onValueChange(val ?? "")}
        required={isRequired}
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          {options.find((option) => option.value === value)?.label ||
            placeholder}
          {/* <SelectValue placeholder={placeholder} /> */}
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
