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
  label: string;
  id: string;
  placeholder: string;
}

function SelectDropdown({ label, id, placeholder }: SelectDropdownProps) {
  return (
    <Field>
      <FieldLabel className={"text-sm w-s"} style={{ color: colors.label }}>
        {label}
      </FieldLabel>
      <Select id={id}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="Addition Hills">Addition Hills</SelectItem>
            <SelectItem value="Batis">Batis</SelectItem>
            <SelectItem value="Balong Bato">Balong Bato</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

export default SelectDropdown;
