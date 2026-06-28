import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldDescription } from "./ui/field";
import colors from "@/constants/colors";
import { Spinner } from "./ui/spinner";
import { X } from "lucide-react";

interface SelectDropdownProps {
  value: string;
  onValueChange: (val: string) => void;
  label?: string;
  id: string;
  placeholder?: string;
  onSubmit?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  options: { label: string; value: string; description?: string }[];
  isRequired?: boolean;
  disabled?: boolean;
  loading?: boolean;
  clearClick?: () => void;
  clearId?: string;
  showClear?: boolean;
  description?: string;
}

function SelectDropdown({
  label,
  id,
  placeholder,
  error,
  onValueChange,
  options,
  value,
  isRequired,
  disabled,
  loading,
  clearClick,
  clearId,
  showClear,
  description,
}: SelectDropdownProps) {
  return (
    <Field>
      <div className="flex flex-row items-center gap-2">
        <FieldLabel className={"text-sm w-s"} style={{ color: colors.label }}>
          {label}
        </FieldLabel>
        {loading && <Spinner />}
      </div>
      <FieldDescription>{description}</FieldDescription>
      <div className="w-full flex flex-row gap-2 overflow-hidden">
        <Select
          modal={false}
          onValueChange={(val: string | null) => onValueChange(val ?? "")}
          required={isRequired}
          disabled={disabled}
          value={value}
        >
          <SelectTrigger id={id} className="w-full overflow-hidden">
            <span className="truncate block">
              {options.find((option) => option.value === value)?.label ||
                placeholder}
            </span>

            {/* <SelectValue placeholder={placeholder} /> */}
          </SelectTrigger>
          <SelectContent className="z-[1600] max-w-[calc(100vw-2rem)]">
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span>
                    {option.label}{" "}
                    {option.description && `- ${option.description}`}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {showClear && (
          <button onClick={clearClick} id={clearId}>
            <X size={14} />
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </Field>
  );
}

export default SelectDropdown;
