import { Filter } from "lucide-react";
import { InputGroup, InputGroupInput, InputGroupAddon } from "./ui/input-group";

function Search() {
  return (
    <>
      <InputGroup className="w-2/3">
        <InputGroupInput
          className="text-sm h-8"
          id="Hotlines_Search"
        ></InputGroupInput>
        <InputGroupAddon align="inline-end">
          <Search />
        </InputGroupAddon>
      </InputGroup>
      <Filter size={18} id="Hotlines_FilterBtn" />
    </>
  );
}

export default Search;
