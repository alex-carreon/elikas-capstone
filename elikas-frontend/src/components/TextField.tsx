import "../App.css";
import colors from "../constants/colors";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { type LucideIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useState, type Ref } from "react";
import { EyeClosed } from "lucide-react";
import { Eye } from "lucide-react";

interface TextFieldProps {
  label?: string;
  description?: string;
  placeholder?: string;
  icon?: LucideIcon;
  endIcon?: LucideIcon;
  inputType: string;
  iconOnClick?: () => {};
  isPassword?: boolean;
  id: string;
  isRequired?: boolean;
  onSubmit?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  value?: string;
  ref?: Ref<HTMLInputElement>;
  accept?: string;
  readonly?: boolean;
  defaultValue?: string;
  capture?: boolean;
}

function TextField({
  label,
  placeholder,
  icon: Icon,
  endIcon: EndIcon,
  inputType,
  isPassword,
  id,
  isRequired = false,
  onSubmit,
  error,
  value,
  ref,
  accept,
  readonly,
  defaultValue,
  description,
  capture,
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col w-full max-w-s self-center">
      <Field className="flex shrink gap-1">
        <FieldLabel className={"text-sm w-s"} style={{ color: colors.label }}>
          {label}
        </FieldLabel>
        <FieldDescription>{description}</FieldDescription>
        <InputGroup>
          <InputGroupInput
            required={isRequired}
            className="w-full max-w-s h-9 outline-1 outline-gray-400 rounded-sm p-3 placeholder:text-sm"
            placeholder={placeholder}
            type={showPassword ? "text" : inputType}
            id={id}
            onChange={onSubmit}
            value={value}
            ref={ref}
            accept={accept}
            readOnly={readonly}
            defaultValue={defaultValue}
            capture={capture}
          ></InputGroupInput>
          <InputGroupAddon>
            {Icon && <Icon style={{ color: colors.activeIcon }}></Icon>}
          </InputGroupAddon>
          {isPassword ? (
            <InputGroupAddon
              align="inline-end"
              className="cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
              id="L-PasswordEye"
            >
              {showPassword ? <Eye></Eye> : <EyeClosed></EyeClosed>}
            </InputGroupAddon>
          ) : (
            EndIcon && <EndIcon></EndIcon>
          )}
        </InputGroup>
      </Field>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export default TextField;
