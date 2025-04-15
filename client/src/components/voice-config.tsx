"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { PlayCircle, StopCircle, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

const voiceProviders = [
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    voices: [
      { id: "el1", name: "Ngọc Anh (Nữ)" },
      { id: "el2", name: "Minh Quân (Nam)" },
      { id: "el3", name: "Thu Hà (Nữ)" },
    ],
  },
  {
    id: "google",
    name: "Google TTS",
    voices: [
      { id: "g1", name: "Lan Hương (Nữ)" },
      { id: "g2", name: "Hoàng Long (Nam)" },
      { id: "g3", name: "Mai Linh (Nữ)" },
    ],
  },
  {
    id: "amazon",
    name: "Amazon Polly",
    voices: [
      { id: "a1", name: "Thúy Ngân (Nữ)" },
      { id: "a2", name: "Đức Trung (Nam)" },
      { id: "a3", name: "Thanh Vân (Nữ)" },
    ],
  },
]

export default function VoiceConfig() {
  const [provider, setProvider] = useState("elevenlabs")
  const [voice, setVoice] = useState("")
  const [speed, setSpeed] = useState([1])
  const [pitch, setPitch] = useState([1])
  const [intensity, setIntensity] = useState([0.5])
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState("ai")

  const selectedProvider = voiceProviders.find((p) => p.id === provider)

  const handlePlay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">Giọng nói AI</TabsTrigger>
          <TabsTrigger value="human">Giọng người thật</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nhà cung cấp giọng nói</label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhà cung cấp" />
              </SelectTrigger>
              <SelectContent>
                {voiceProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Giọng nói</label>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn giọng nói" />
              </SelectTrigger>
              <SelectContent>
                {selectedProvider?.voices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Tốc độ đọc</label>
                <span className="text-sm text-gray-500">{speed[0]}x</span>
              </div>
              <Slider value={speed} min={0.5} max={2} step={0.1} onValueChange={setSpeed} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Âm điệu</label>
                <span className="text-sm text-gray-500">{pitch[0]}x</span>
              </div>
              <Slider value={pitch} min={0.5} max={1.5} step={0.1} onValueChange={setPitch} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Cường độ</label>
                <span className="text-sm text-gray-500">{Math.round(intensity[0] * 100)}%</span>
              </div>
              <Slider value={intensity} min={0} max={1} step={0.01} onValueChange={setIntensity} />
            </div>
          </div>

          <div className="pt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Xem trước giọng nói</CardTitle>
                <CardDescription>Nghe thử giọng nói với cấu hình hiện tại</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 italic">
                  "Khoa học là ánh sáng soi đường cho nhân loại. Mỗi khám phá mới đều mở ra một chân trời kiến thức rộng
                  lớn hơn."
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={handlePlay}>
                  {isPlaying ? (
                    <>
                      <StopCircle className="mr-2 h-4 w-4" />
                      Dừng
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Phát
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="human">
          <div className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium">Tải lên file âm thanh</h3>
              <p className="text-sm text-gray-500 mt-2 mb-4">
                Kéo và thả file MP3 hoặc WAV vào đây, hoặc nhấn vào nút bên dưới để chọn file
              </p>
              <Button variant="outline">Chọn file</Button>
            </div>

            <div className="text-sm text-gray-500">
              <p>Lưu ý:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Hỗ trợ định dạng MP3, WAV</li>
                <li>Kích thước tối đa: 50MB</li>
                <li>Thời lượng tối đa: 30 phút</li>
                <li>Chất lượng âm thanh tốt nhất: 44.1kHz, 16-bit</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
