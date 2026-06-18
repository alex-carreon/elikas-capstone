import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
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
  desc?: string;
  isRequired?: boolean;
  readonly?: boolean;
  idField: string;
  idTime?: string;
  idBtn: string;
  placeholder?: string;
  onChange?: (date: Date | undefined) => void;
  value?: Date;
  showTime?: boolean;
  edit?: boolean;
  timeNow?: boolean;
  clearDate?: boolean;
  clearTime?: boolean;
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
  timeNow,
  desc,
  idTime,
  clearDate,
  clearTime,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(value);
  const [inputValue, setInputValue] = useState(formatDate(value));
  const [time, setTime] = useState(() => {
    if (value)
      return format(toZonedTime(value, TIMEZONE), "HH:mm", {
        timeZone: TIMEZONE,
      });
    if (timeNow) {
      const now = toZonedTime(new Date(), TIMEZONE);
      return format(now, "HH:mm", { timeZone: TIMEZONE });
    }
    return "";
  });

  useEffect(() => {
    setInputValue(formatDate(value));
    setMonth(value);

    if (value) {
      setInputValue(formatDate(value));
      setMonth(value);
      setTime(
        format(toZonedTime(value, TIMEZONE), "HH:mm", { timeZone: TIMEZONE }),
      );
    } else {
      // handle clear from parent
      setInputValue("");
      setMonth(undefined);
      setTime(
        timeNow
          ? format(toZonedTime(new Date(), TIMEZONE), "HH:mm", {
              timeZone: TIMEZONE,
            })
          : "",
      );
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

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setTime(raw);

    const datePart = inputValue || formatDate(value);

    if (datePart && raw) {
      const combined = fromZonedTime(`${datePart} ${raw}`, TIMEZONE);
      if (isValidDate(combined)) {
        onChange?.(combined);
      }
    }
  }

  function handleCalendarSelect(selected: Date | undefined) {
    if (selected && showTime) {
      const timeFinal =
        time ||
        (timeNow
          ? format(toZonedTime(new Date(), TIMEZONE), "HH:mm", {
              timeZone: TIMEZONE,
            })
          : "00:00");
      // const now = toZonedTime(new Date(), TIMEZONE);
      // const hours = String(now.getHours()).padStart(2, "0");
      // const minutes = String(now.getMinutes()).padStart(2, "0");

      const localString = format(selected, "yyyy-MM-dd", {
        timeZone: TIMEZONE,
      });
      const combined = fromZonedTime(`${localString} ${timeFinal}`, TIMEZONE);
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

  function handleDateClear() {
    setInputValue("");
    setMonth(undefined);
    onChange?.(undefined);
  }

  function handleTimeClear() {
    setTime(
      timeNow
        ? format(toZonedTime(new Date(), TIMEZONE), "HH:mm", {
            timeZone: TIMEZONE,
          })
        : "",
    );
    onChange?.(undefined);
  }

  return (
    <Field className="w-full">
      <FieldLabel htmlFor="date-required">{label}</FieldLabel>
      <FieldDescription>{desc}</FieldDescription>
      <div className="flex items-center gap-2">
        <InputGroup className="w-1/2">
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
        {inputValue && clearDate && <X size={18} onClick={handleDateClear} />}
      </div>
      <div className="flex items-center gap-2">
        {showTime && (
          <InputGroup className="w-1/2">
            <InputGroupInput
              type="time"
              value={time}
              onChange={handleTimeChange}
              readOnly={readonly}
              className="w-auto"
              id={idTime}
              required={isRequired}
            />
          </InputGroup>
        )}
        {time && clearTime && <X size={18} onClick={handleTimeClear} />}
      </div>
    </Field>
  );
}

export default DatePickerInput;
