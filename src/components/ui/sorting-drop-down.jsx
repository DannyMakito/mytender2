import { useState } from "react";
import { DropdownMenu, DropdownMenuTrigger,DropdownMenuContent, DropdownMenuCheckboxItem } from "./dropdown-menu"
import { IoMdArrowDropdown, IoMdArrowUp } from "react-icons/io";



const options = ["A-Z","Z-A"];

export function SortingDropDown(){



    const [selectedOption, setSelectedOption] = useState("A-Z");

    return( 
        <DropdownMenu >
        <DropdownMenuTrigger asChild>
            <button variant="ghost" >
                <span className="font-medium text-sm">{selectedOption}</span>
            {selectedOption === "A-Z" ? (
                <IoMdArrowDropdown className="text-sm" />
            ) : ( <IoMdArrowUp className="text-sm" />
            )}
            </button>
        </DropdownMenuTrigger>

            <DropdownMenuContent 
            className="w-20 poppins"
            >
                {options.map((option,key) => (
                    <DropdownMenuCheckboxItem
                     key={key}
                      onClick={() => setSelectedOption(option)}
                      checked={selectedOption === option}
                      className="h-9">
                        {option}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
            
        </DropdownMenu>

    )
}