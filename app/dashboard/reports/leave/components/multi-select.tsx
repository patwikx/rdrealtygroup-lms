"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover"
import {
 Command,
 CommandEmpty,
 CommandGroup,
 CommandInput,
 CommandItem,
 CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

export interface MultiSelectOption {
 id: string
 name: string
}

interface MultiSelectProps {
 options: MultiSelectOption[]
 selected: string[]
 onChange: (selected: string[]) => void
 placeholder?: string
 className?: string
}

export function MultiSelect({
 options,
 selected,
 onChange,
 placeholder = "Select...",
 className,
}: MultiSelectProps) {
 const [open, setOpen] = React.useState(false)

 const handleToggle = (id: string) => {
  const newSelected = selected.includes(id)
   ? selected.filter((item) => item !== id)
   : [...selected, id]
  onChange(newSelected)
 }

 return (
  <Popover open={open} onOpenChange={setOpen}>
   <PopoverTrigger asChild>
    <Button
     variant="outline"
     role="combobox"
     aria-expanded={open}
     className={cn("w-[220px] justify-between font-normal", className)}
    >
          {/* FIX: Wrap button contents in a single element */}
     <div className="flex w-full items-center justify-between">
      <span className="truncate">
       {selected.length > 0
        ? `${options.find(o => o.id === selected[0])?.name ?? ""} ${
          selected.length > 1 ? `+${selected.length - 1}` : ""
         }`
        : placeholder}
      </span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
     </div>
    </Button>
   </PopoverTrigger>
   <PopoverContent className="w-[250px] p-0">
    <Command>
     <CommandInput placeholder="Search..." />
     <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup>
       {options.map((option) => (
        <CommandItem key={option.id} onSelect={() => handleToggle(option.id)}>
         <Check className={cn("mr-2 h-4 w-4", selected.includes(option.id) ? "opacity-100" : "opacity-0")} />
         {option.name}
        </CommandItem>
       ))}
      </CommandGroup>
     </CommandList>
    </Command>
   </PopoverContent>
  </Popover>
 )
}