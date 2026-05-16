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
}

function MultiSelect({ items, label }: MultiSelectProps) {
  const anchor = useComboboxAnchor();

  return (
    <Field>
      <FieldLabel className={"text-sm w-s"} style={{ color: colors.label }}>
        {label}
      </FieldLabel>
      <FieldDescription>Press and choose from the list</FieldDescription>
      <Combobox multiple autoHighlight items={items}>
        <ComboboxChips ref={anchor} className="w-full max-w-xs">
          <ComboboxValue>
            {(values: any) => (
              <React.Fragment>
                {values.map((value: string) => (
                  <ComboboxChip key={value}>{value}</ComboboxChip>
                ))}
                <ComboboxChipsInput />
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
    </Field>
  );
}

export default MultiSelect;
