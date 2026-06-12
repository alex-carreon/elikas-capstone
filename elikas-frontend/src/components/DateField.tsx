import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toZonedTime, fromZonedTime, format } from "date-fns-tz";

const TIMEZONE = "Asia/Manila";

function formatDate(date: Date | undefined) {
  if (!date) return "";
  return format(toZonedTime(date, TIMEZONE), "yyyy-MM-dd", {
    timeZone: TIMEZONE,
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

interface DatePickerProps {
  label: string;
  isRequired?: boolean;
  readonly?: boolean;
  idField: string;
  idBtn: string;
  placeholder: string;
  onChange?: (date: Date | undefined) => void;
  value?: Date;
  showTime?: boolean;
  edit?: boolean;
}

function DatePickerInput({
  label,
  isRequired,
  readonly,
  idField,
  idBtn,
  onChange,
  placeholder,
  value,
  showTime,
  edit,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(value);
  const [inputValue, setInputValue] = React.useState(formatDate(value));

  useEffect(() => {
    setInputValue(formatDate(value));
    setMonth(value);

    if (value) {
      setInputValue(formatDate(value));
      setMonth(value);
    }
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = new Date(raw);
    if (isValidDate(parsed)) {
      setMonth(parsed);
      onChange?.(parsed);
    } else {
      onChange?.(undefined);
    }
  }

  function handleCalendarSelect(selected: Date | undefined) {
    if (selected && showTime) {
      const now = toZonedTime(new Date(), TIMEZONE);
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      const localString = format(selected, "yyyy-MM-dd", {
        timeZone: TIMEZONE,
      });
      const combined = fromZonedTime(
        `${localString}T${hours}:${minutes}`,
        TIMEZONE,
      );
      onChange?.(combined);
      setInputValue(formatDate(combined));
      setMonth(combined);
    } else {
      onChange?.(selected);
      setInputValue(formatDate(selected));
      setMonth(selected);
    }
    setOpen(false);
  }

  return (
    <Field className="w-full">
      <FieldLabel htmlFor="date-required">{label}</FieldLabel>

      <InputGroup>
        <InputGroupInput
          id={idField}
          value={inputValue}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          required={isRequired}
          readOnly={readonly}
        />
        {edit ? (
          <InputGroupAddon align="inline-end">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger>
                <InputGroupButton
                  id={idBtn}
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Select date"
                >
                  <CalendarIcon />
                  <span className="sr-only">Select date</span>
                </InputGroupButton>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0 z-[600]"
                align="end"
                alignOffset={-8}
                sideOffset={10}
              >
                <Calendar
                  mode="single"
                  selected={value}
                  month={month}
                  onMonthChange={setMonth}
                  onSelect={handleCalendarSelect}
                />
              </PopoverContent>
            </Popover>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </Field>
  );
}

export default DatePickerInput;
