"use client";

import * as React from "react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Field, FieldLabel, FieldDescription } from "./ui/field";
import colors from "@/constants/colors";

interface MultiSelectProps {
  items: string[];
  label: string;
  idField: string;
  idInput: string;
}

function MultiSelect({ items, label, idField, idInput }: MultiSelectProps) {
  const anchor = useComboboxAnchor();

  return (
    <Field>
      <FieldLabel className={"text-sm w-s"} style={{ color: colors.label }}>
        {label}
      </FieldLabel>
      <FieldDescription>Press and choose from the list</FieldDescription>
      <div className="w-full max-w-xs">
        <Combobox multiple autoHighlight items={items} id={idField}>
          <ComboboxChips ref={anchor}>
            <ComboboxValue>
              {(values: any) => (
                <React.Fragment>
                  {values.map((value: string) => (
                    <ComboboxChip key={value}>{value}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput id={idInput} />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </Field>
  );
}

export default MultiSelect;
