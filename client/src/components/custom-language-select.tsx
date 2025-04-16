"use client"

import { useState, useRef } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { Input } from "../components/ui/input"

const languages = [
  { value: "abkhaz", label: "Tiếng Abkhaz" },
  { value: "afar", label: "Tiếng Afar" },
  { value: "afrikaans", label: "Tiếng Afrikaans" },
  { value: "akan", label: "Tiếng Akan" },
  { value: "albanian", label: "Tiếng Albania" },
  { value: "amharic", label: "Tiếng Amharic" },
  { value: "arabic", label: "Tiếng Ả Rập" },
  { value: "aragonese", label: "Tiếng Aragonese" },
  { value: "armenian", label: "Tiếng Armenia" },
  { value: "assamese", label: "Tiếng Assam" },
  { value: "avaric", label: "Tiếng Avaric" },
  { value: "avestan", label: "Tiếng Avestan" },
  { value: "aymara", label: "Tiếng Aymara" },
  { value: "azerbaijani", label: "Tiếng Azerbaijan" },
  { value: "bambara", label: "Tiếng Bambara" },
  { value: "bashkir", label: "Tiếng Bashkir" },
  { value: "basque", label: "Tiếng Basque" },
  { value: "belarusian", label: "Tiếng Belarus" },
  { value: "bengali", label: "Tiếng Bengali" },
  { value: "bihari", label: "Tiếng Bihari" },
  { value: "bislama", label: "Tiếng Bislama" },
  { value: "bosnian", label: "Tiếng Bosnia" },
  { value: "breton", label: "Tiếng Breton" },
  { value: "bulgarian", label: "Tiếng Bulgaria" },
  { value: "burmese", label: "Tiếng Myanmar" },
  { value: "catalan", label: "Tiếng Catalan" },
  { value: "chamorro", label: "Tiếng Chamorro" },
  { value: "chechen", label: "Tiếng Chechen" },
  { value: "chichewa", label: "Tiếng Chichewa" },
  { value: "chinese", label: "Tiếng Trung" },
  { value: "chuvash", label: "Tiếng Chuvash" },
  { value: "cornish", label: "Tiếng Cornwall" },
  { value: "corsican", label: "Tiếng Corsica" },
  { value: "cree", label: "Tiếng Cree" },
  { value: "croatian", label: "Tiếng Croatia" },
  { value: "czech", label: "Tiếng Séc" },
  { value: "danish", label: "Tiếng Đan Mạch" },
  { value: "divehi", label: "Tiếng Divehi" },
  { value: "dutch", label: "Tiếng Hà Lan" },
  { value: "dzongkha", label: "Tiếng Dzongkha" },
  { value: "english", label: "Tiếng Anh" },
  { value: "esperanto", label: "Tiếng Esperanto" },
  { value: "estonian", label: "Tiếng Estonia" },
  { value: "ewe", label: "Tiếng Ewe" },
  { value: "faroese", label: "Tiếng Faroe" },
  { value: "fijian", label: "Tiếng Fiji" },
  { value: "finnish", label: "Tiếng Phần Lan" },
  { value: "french", label: "Tiếng Pháp" },
  { value: "fula", label: "Tiếng Fula" },
  { value: "galician", label: "Tiếng Galicia" },
  { value: "georgian", label: "Tiếng Georgia" },
  { value: "german", label: "Tiếng Đức" },
  { value: "greek", label: "Tiếng Hy Lạp" },
  { value: "guarani", label: "Tiếng Guarani" },
  { value: "gujarati", label: "Tiếng Gujarat" },
  { value: "haitian", label: "Tiếng Haiti" },
  { value: "hausa", label: "Tiếng Hausa" },
  { value: "hebrew", label: "Tiếng Do Thái" },
  { value: "herero", label: "Tiếng Herero" },
  { value: "hindi", label: "Tiếng Hindi" },
  { value: "hiri_motu", label: "Tiếng Hiri Motu" },
  { value: "hungarian", label: "Tiếng Hungary" },
  { value: "icelandic", label: "Tiếng Iceland" },
  { value: "ido", label: "Tiếng Ido" },
  { value: "igbo", label: "Tiếng Igbo" },
  { value: "indonesian", label: "Tiếng Indonesia" },
  { value: "interlingua", label: "Tiếng Interlingua" },
  { value: "interlingue", label: "Tiếng Interlingue" },
  { value: "inuktitut", label: "Tiếng Inuktitut" },
  { value: "inupiaq", label: "Tiếng Inupiaq" },
  { value: "irish", label: "Tiếng Ireland" },
  { value: "italian", label: "Tiếng Ý" },
  { value: "japanese", label: "Tiếng Nhật" },
  { value: "javanese", label: "Tiếng Java" },
  { value: "kalaallisut", label: "Tiếng Kalaallisut" },
  { value: "kannada", label: "Tiếng Kannada" },
  { value: "kanuri", label: "Tiếng Kanuri" },
  { value: "kashmiri", label: "Tiếng Kashmir" },
  { value: "kazakh", label: "Tiếng Kazakhstan" },
  { value: "khmer", label: "Tiếng Khmer" },
  { value: "kikuyu", label: "Tiếng Kikuyu" },
  { value: "kinyarwanda", label: "Tiếng Kinyarwanda" },
  { value: "kirundi", label: "Tiếng Kirundi" },
  { value: "komi", label: "Tiếng Komi" },
  { value: "kongo", label: "Tiếng Kongo" },
  { value: "korean", label: "Tiếng Hàn" },
  { value: "kurdish", label: "Tiếng Kurd" },
  { value: "kwanyama", label: "Tiếng Kwanyama" },
  { value: "kyrgyz", label: "Tiếng Kyrgyz" },
  { value: "lao", label: "Tiếng Lào" },
  { value: "latin", label: "Tiếng Latin" },
  { value: "latvian", label: "Tiếng Latvia" },
  { value: "limburgish", label: "Tiếng Limburg" },
  { value: "lingala", label: "Tiếng Lingala" },
  { value: "lithuanian", label: "Tiếng Lithuania" },
  { value: "luba_katanga", label: "Tiếng Luba-Katanga" },
  { value: "luxembourgish", label: "Tiếng Luxembourg" },
  { value: "macedonian", label: "Tiếng Macedonia" },
  { value: "malagasy", label: "Tiếng Madagascar" },
  { value: "malay", label: "Tiếng Mã Lai" },
  { value: "malayalam", label: "Tiếng Malayalam" },
  { value: "maltese", label: "Tiếng Malta" },
  { value: "manx", label: "Tiếng Manx" },
  { value: "maori", label: "Tiếng Maori" },
  { value: "marathi", label: "Tiếng Marathi" },
  { value: "marshallese", label: "Tiếng Marshall" },
  { value: "mongolian", label: "Tiếng Mông Cổ" },
  { value: "nauru", label: "Tiếng Nauru" },
  { value: "navajo", label: "Tiếng Navajo" },
  { value: "ndonga", label: "Tiếng Ndonga" },
  { value: "nepali", label: "Tiếng Nepal" },
  { value: "north_ndebele", label: "Tiếng Ndebele Bắc" },
  { value: "northern_sami", label: "Tiếng Sami Bắc" },
  { value: "norwegian", label: "Tiếng Na Uy" },
  { value: "norwegian_bokmal", label: "Tiếng Na Uy Bokmål" },
  { value: "norwegian_nynorsk", label: "Tiếng Na Uy Nynorsk" },
  { value: "nuosu", label: "Tiếng Nuosu" },
  { value: "occitan", label: "Tiếng Occitan" },
  { value: "ojibwe", label: "Tiếng Ojibwe" },
  { value: "old_church_slavonic", label: "Tiếng Slavơ Nhà thờ cổ" },
  { value: "oriya", label: "Tiếng Oriya" },
  { value: "oromo", label: "Tiếng Oromo" },
  { value: "ossetian", label: "Tiếng Ossetia" },
  { value: "pali", label: "Tiếng Pali" },
  { value: "pashto", label: "Tiếng Pashto" },
  { value: "persian", label: "Tiếng Ba Tư" },
  { value: "polish", label: "Tiếng Ba Lan" },
  { value: "portuguese", label: "Tiếng Bồ Đào Nha" },
  { value: "punjabi", label: "Tiếng Punjab" },
  { value: "quechua", label: "Tiếng Quechua" },
  { value: "romanian", label: "Tiếng Romania" },
  { value: "romansh", label: "Tiếng Romansh" },
  { value: "russian", label: "Tiếng Nga" },
  { value: "samoan", label: "Tiếng Samoa" },
  { value: "sango", label: "Tiếng Sango" },
  { value: "sanskrit", label: "Tiếng Phạn" },
  { value: "sardinian", label: "Tiếng Sardinia" },
  { value: "scottish_gaelic", label: "Tiếng Gael Scotland" },
  { value: "serbian", label: "Tiếng Serbia" },
  { value: "shona", label: "Tiếng Shona" },
  { value: "sindhi", label: "Tiếng Sindhi" },
  { value: "sinhala", label: "Tiếng Sinhala" },
  { value: "slovak", label: "Tiếng Slovakia" },
  { value: "slovene", label: "Tiếng Slovenia" },
  { value: "somali", label: "Tiếng Somalia" },
  { value: "south_ndebele", label: "Tiếng Ndebele Nam" },
  { value: "southern_sotho", label: "Tiếng Sotho Nam" },
  { value: "spanish", label: "Tiếng Tây Ban Nha" },
  { value: "sundanese", label: "Tiếng Sunda" },
  { value: "swahili", label: "Tiếng Swahili" },
  { value: "swati", label: "Tiếng Swati" },
  { value: "swedish", label: "Tiếng Thụy Điển" },
  { value: "tagalog", label: "Tiếng Tagalog" },
  { value: "tahitian", label: "Tiếng Tahiti" },
  { value: "tajik", label: "Tiếng Tajik" },
  { value: "tamil", label: "Tiếng Tamil" },
  { value: "tatar", label: "Tiếng Tatar" },
  { value: "telugu", label: "Tiếng Telugu" },
  { value: "thai", label: "Tiếng Thái" },
  { value: "tibetan", label: "Tiếng Tây Tạng" },
  { value: "tigrinya", label: "Tiếng Tigrinya" },
  { value: "tonga", label: "Tiếng Tonga" },
  { value: "tsonga", label: "Tiếng Tsonga" },
  { value: "tswana", label: "Tiếng Tswana" },
  { value: "turkish", label: "Tiếng Thổ Nhĩ Kỳ" },
  { value: "turkmen", label: "Tiếng Turkmen" },
  { value: "twi", label: "Tiếng Twi" },
  { value: "uighur", label: "Tiếng Uyghur" },
  { value: "ukrainian", label: "Tiếng Ukraine" },
  { value: "urdu", label: "Tiếng Urdu" },
  { value: "uzbek", label: "Tiếng Uzbek" },
  { value: "venda", label: "Tiếng Venda" },
  { value: "vietnamese", label: "Tiếng Việt" },
  { value: "volapuk", label: "Tiếng Volapük" },
  { value: "walloon", label: "Tiếng Walloon" },
  { value: "welsh", label: "Tiếng Wales" },
  { value: "western_frisian", label: "Tiếng Frisia Tây" },
  { value: "wolof", label: "Tiếng Wolof" },
  { value: "xhosa", label: "Tiếng Xhosa" },
  { value: "yiddish", label: "Tiếng Yiddish" },
  { value: "yoruba", label: "Tiếng Yoruba" },
  { value: "zhuang", label: "Tiếng Zhuang" },
  { value: "zulu", label: "Tiếng Zulu" }
]

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

  // Find the selected language label
  const selectedLanguageLabel: string = 
    languages.find((language: { value: string; label: string }) => language.value === selectedLanguage)?.label || value

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
                    <CommandItem key={language.value} value={language.value} onSelect={handleSelect}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedLanguage === language.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {language.label}
                    </CommandItem>
                  ))}
                  <CommandItem value="custom" onSelect={handleSelect}>
                    <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                    Ngôn ngữ khác...
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
