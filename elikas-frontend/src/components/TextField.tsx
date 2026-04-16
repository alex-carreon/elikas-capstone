import "../App.css";
import colors from "../constants/colors";
import { Field, FieldLabel } from "@/components/ui/field";
import { type LucideIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useState } from "react";
import { EyeClosed } from "lucide-react";
import { Eye } from "lucide-react";

interface TextFieldProps {
  label: string;
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
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col w-full max-w-s self-center">
      <Field className="flex shrink">
        <FieldLabel className={"text-sm w-s"} style={{ color: colors.label }}>
          {label}
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            required={isRequired}
            className="w-full max-w-s h-9 outline-1 outline-gray-400 rounded-sm p-3 placeholder:text-sm"
            placeholder={placeholder}
            type={showPassword ? "text" : inputType}
            id={id}
            onChange={onSubmit}
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
