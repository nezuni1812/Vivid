"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { Input } from "../components/ui/input"

const languages = [
  { value: "afrikaans", label: "Tiếng Afrikaans" },
  { value: "arabic", label: "Tiếng Ả Rập" },
  { value: "bengali", label: "Tiếng Bengali" },
  { value: "bulgarian", label: "Tiếng Bulgaria" },
  { value: "catalan", label: "Tiếng Catalan" },
  { value: "chinese", label: "Tiếng Trung" },
  { value: "croatian", label: "Tiếng Croatia" },
  { value: "czech", label: "Tiếng Séc" },
  { value: "danish", label: "Tiếng Đan Mạch" },
  { value: "dutch", label: "Tiếng Hà Lan" },
  { value: "english", label: "Tiếng Anh" },
  { value: "estonian", label: "Tiếng Estonia" },
  { value: "finnish", label: "Tiếng Phần Lan" },
  { value: "french", label: "Tiếng Pháp" },
  { value: "german", label: "Tiếng Đức" },
  { value: "greek", label: "Tiếng Hy Lạp" },
  { value: "gujarati", label: "Tiếng Gujarat" },
  { value: "hindi", label: "Tiếng Hindi" },
  { value: "hungarian", label: "Tiếng Hungary" },
  { value: "icelandic", label: "Tiếng Iceland" },
  { value: "indonesian", label: "Tiếng Indonesia" },
  { value: "italian", label: "Tiếng Ý" },
  { value: "japanese", label: "Tiếng Nhật" },
  { value: "korean", label: "Tiếng Hàn" },
  { value: "latvian", label: "Tiếng Latvia" },
  { value: "lithuanian", label: "Tiếng Lithuania" },
  { value: "malay", label: "Tiếng Mã Lai" },
  { value: "malayalam", label: "Tiếng Malayalam" },
  { value: "norwegian", label: "Tiếng Na Uy" },
  { value: "polish", label: "Tiếng Ba Lan" },
  { value: "portuguese", label: "Tiếng Bồ Đào Nha" },
  { value: "romanian", label: "Tiếng Romania" },
  { value: "russian", label: "Tiếng Nga" },
  { value: "serbian", label: "Tiếng Serbia" },
  { value: "slovak", label: "Tiếng Slovakia" },
  { value: "slovenian", label: "Tiếng Slovenia" },
  { value: "spanish", label: "Tiếng Tây Ban Nha" },
  { value: "swahili", label: "Tiếng Swahili" },
  { value: "swedish", label: "Tiếng Thụy Điển" },
  { value: "tamil", label: "Tiếng Tamil" },
  { value: "telugu", label: "Tiếng Telugu" },
  { value: "thai", label: "Tiếng Thái" },
  { value: "turkish", label: "Tiếng Thổ Nhĩ Kỳ" },
  { value: "ukrainian", label: "Tiếng Ukraine" },
  { value: "urdu", label: "Tiếng Urdu" },
  { value: "vietnamese", label: "Tiếng Việt" },
  { value: "welsh", label: "Tiếng Wales" },
];

interface LanguageSelectProps {
  value: string
  onChange: (value: string) => void
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const [open, setOpen] = useState(false)
  const [customLanguage, setCustomLanguage] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState(value)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelectedLanguage(value);
    console.log("LanguageSelect - value:", value, "selectedLanguage:", value);
  }, [value]);

  // Find the selected language label
  const selectedLanguageLabel: string = 
    languages.find((language) => language.value === selectedLanguage)?.label || 
    (customLanguage.trim() ? customLanguage : "Unknown Language");

  // Handle language selection
  const handleSelect = (currentValue: string) => {
    if (currentValue === "custom") {
      setShowCustomInput(true)
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setSelectedLanguage(currentValue)
      onChange(currentValue)
      setOpen(false)
      setShowCustomInput(false)
    }
  }

  // Handle custom language input
  const handleCustomLanguageSubmit = () => {
    if (customLanguage.trim()) {
      setSelectedLanguage(customLanguage)
      onChange(customLanguage)
      setOpen(false)
      setShowCustomInput(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Ngôn ngữ</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selectedLanguageLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          {showCustomInput ? (
            <div className="flex items-center p-2">
              <Input
                ref={inputRef}
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                placeholder="Nhập ngôn ngữ..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCustomLanguageSubmit()
                  }
                }}
              />
              <Button size="sm" className="ml-2" onClick={handleCustomLanguageSubmit}>
                Xác nhận
              </Button>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder="Tìm kiếm ngôn ngữ..." />
              <CommandList>
                <CommandEmpty>Không tìm thấy ngôn ngữ.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {languages.map((language) => (
                    <CommandItem
                      key={language.value}
                      value={language.value}
                      onSelect={() => handleSelect(language.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedLanguage === language.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {language.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
