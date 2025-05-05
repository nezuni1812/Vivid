"use client"
import { useWorkspace } from "../context/WorkspaceContext"
import type React from "react"

import { useState, useRef } from "react"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { Upload, Volume2, Loader2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import axios from "axios"

const voiceProviders = [
  {
    id: "edge_tts",
    name: "Edge TTS",
    voices: [
      { id: "female", name: "Nữ" },
      { id: "male", name: "Nam" },
    ],
  },
  {
    id: "gtts",
    name: "Google TTS",
    voices: [{ id: "default", name: "Mặc định" }],
  },
  // {
  //   id: "amazon",
  //   name: "Amazon Polly",
  //   voices: [
  //     { id: "a1", name: "Thúy Ngân (Nữ)" },
  //     { id: "a2", name: "Đức Trung (Nam)" },
  //     { id: "a3", name: "Thanh Vân (Nữ)" },
  //   ],
  // },
]

export default function VoiceConfig({workspace_id}:{workspace_id:string}) {
  const [provider, setProvider] = useState("gtts")
  const [voice, setVoice] = useState("default")
  const [speed, setSpeed] = useState([1])
  const [pitch, setPitch] = useState([1])
  const [intensity, setIntensity] = useState([0.5])
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState("ai")
  const [showAudioPreview, setShowAudioPreview] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null) // Lưu URL âm thanh thực tế
  const [selectedVoiceFile, setSelectedVoiceFile] = useState<File | null>(null)
  const [isUploadingVoice, setIsUploadingVoice] = useState(false)
  const [uploadVoiceError, setUploadVoiceError] = useState<string | null>(null)
  const [uploadedVoiceUrl, setUploadedVoiceUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { scriptId, workspaceId } = useWorkspace()

  const selectedProvider = voiceProviders.find((p) => p.id === provider)

  const handlePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handleCreateAudio = async () => {
    if (!scriptId) {
      alert("Vui lòng tạo kịch bản trước khi tạo âm thanh.")
      return
    }

    setIsGeneratingAudio(true)

    try {
      // Chuyển đổi intensity (0-1) thành volume (-12.0 đến 12.0 dB)
      const volume = (intensity[0] - 0.5) * 24 // Chuyển từ [0,1] sang [-12,12]
      const engine = provider
      const gender = voice === "default" ? "female" : voice
      const response = await axios.post(`http://127.0.0.1:5000/scripts/${scriptId}/generate_audio`, {
        speed: speed[0],
        pitch: pitch[0],
        volume: volume,
        engine: engine,
        gender: gender,
      })

      if (response.status === 201 && response.data?.audio_url) {
        setAudioUrl(response.data.audio_url)
        setShowAudioPreview(true)
        alert("Tạo âm thanh thành công!")
      } else {
        throw new Error("Phản hồi API không chứa URL âm thanh")
      }
    } catch (error: any) {
      console.error("Error generating audio:", error)
      alert(error.response?.data?.error || "Đã xảy ra lỗi khi tạo âm thanh.")
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const handleVoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Kiểm tra định dạng file
      const fileExt = file.name.split(".").pop()?.toLowerCase()
      if (fileExt === "mp3" || fileExt === "wav" || fileExt === "m4a") {
        setSelectedVoiceFile(file)
      } else {
        alert("Chỉ chấp nhận file .mp3 hoặc .wav")
        e.target.value = ""
      }
    }
  }

  const removeSelectedVoiceFile = () => {
    setSelectedVoiceFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadVoiceFile = async () => {
    if (!selectedVoiceFile) {
      alert("Vui lòng chọn tệp âm thanh và tạo kịch bản trước")
      return
    }
  
    if (!workspaceId) {
      alert("Không tìm thấy workspace ID")
      return
    }

    setIsUploadingVoice(true)
    setUploadVoiceError(null)
  
    try {
      const formData = new FormData()
      // Đổi tên từ 'file' thành 'audio_file'
      formData.append("audio_file", selectedVoiceFile)
      
      // Cần workspaceId thay vì scriptId
      formData.append("workspace_id", workspace_id) // Lấy từ context
      
      // Thêm language (tùy chọn)
      formData.append("language", "vietnamese")
  
      const response = await axios.post("http://127.0.0.1:5000/generate-audio-from-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
  
      // Đổi việc kiểm tra từ 'voice_url' thành 'audio_url'
      if (response.data && response.data.audio_url) {
        setUploadedVoiceUrl(response.data.audio_url)
        
        // Có thể cập nhật scriptId từ kết quả trả về
        if (response.data.script_id) {
          // Update script ID in context
          // setScriptId(response.data.script_id)
        }
        
        alert("Tải lên giọng nói thành công!")
      }
    } catch (error: any) {
      console.error("Error uploading voice file:", error)
      setUploadVoiceError(error.response?.data?.error || "Đã xảy ra lỗi khi xử lý tệp âm thanh")
    } finally {
      setIsUploadingVoice(false)
    }
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
                <CardTitle className="text-base">Thông tin âm thanh</CardTitle>
                <CardDescription>{showAudioPreview ? "Âm thanh đã được tạo" : "Chưa có âm thanh"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {showAudioPreview && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">URL:</span>{" "}
                      <a
                        href={audioUrl || "#"}
                        className="text-blue-600 hover:underline break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {audioUrl}
                      </a>
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Nhà cung cấp:</span> {selectedProvider?.name}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="default" className="w-full" onClick={handleCreateAudio} disabled={isGeneratingAudio}>
                  {isGeneratingAudio ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Tạo âm thanh
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {showAudioPreview && audioUrl && (
              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Xem trước âm thanh</label>
                <div className="border rounded-md p-4 bg-gray-50">
                  <audio key={audioUrl} src={audioUrl || "#"} controls className="w-full" />
                  <p className="text-xs text-gray-500 mt-2">
                    Bạn có thể nghe thử âm thanh được tạo từ kịch bản đã phê duyệt
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="human" className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tải lên giọng người thật</label>
            <div
              className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleVoiceFileChange}
                accept=".mp3,.wav,.m4a"
                className="hidden"
              />
              {!selectedVoiceFile ? (
                <>
                  <Upload className="h-6 w-6 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Nhấp để tải lên hoặc kéo và thả file .mp3, .wav</p>
                  <p className="text-xs text-gray-400 mt-1">Kích thước tối đa: 50MB</p>
                </>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex items-center">
                    <Volume2 className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium truncate max-w-xs">{selectedVoiceFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSelectedVoiceFile()
                    }}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              )}
            </div>
            {selectedVoiceFile && (
              <div className="mt-2">
                <Button
                  onClick={handleUploadVoiceFile}
                  disabled={isUploadingVoice}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isUploadingVoice ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý tệp...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Tải lên giọng nói
                    </>
                  )}
                </Button>
                {uploadVoiceError && <p className="text-red-500 text-sm mt-1">{uploadVoiceError}</p>}
              </div>
            )}
          </div>

          {uploadedVoiceUrl && (
            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium">Xem trước giọng nói đã tải lên</label>
              <div className="border rounded-md p-4 bg-gray-50">
                <audio key={uploadedVoiceUrl} src={uploadedVoiceUrl} controls className="w-full" />
                <p className="text-xs text-gray-500 mt-2">Giọng nói đã tải lên sẽ được sử dụng cho kịch bản của bạn</p>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p>Lưu ý:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Hỗ trợ định dạng MP3, WAV</li>
              <li>Kích thước tối đa: 50MB</li>
              <li>Thời lượng tối đa: 30 phút</li>
              <li>Chất lượng âm thanh tốt nhất: 44.1kHz, 16-bit</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
