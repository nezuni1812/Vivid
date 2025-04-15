"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Wand2, RefreshCw, Check, Edit2, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("modern")
  const [ratio, setRatio] = useState("16:9")
  const [resolution, setResolution] = useState("1080p")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  const handleGenerate = () => {
    if (!prompt) return

    setIsGenerating(true)

    // Simulate AI image generation
    setTimeout(() => {
      const newImages = [
        "/placeholder.svg?height=360&width=640",
        "/placeholder.svg?height=360&width=640",
        "/placeholder.svg?height=360&width=640",
        "/placeholder.svg?height=360&width=640",
      ]

      setGeneratedImages(newImages)
      setIsGenerating(false)
    }, 3000)
  }

  const toggleImageSelection = (image: string) => {
    if (selectedImages.includes(image)) {
      setSelectedImages(selectedImages.filter((img) => img !== image))
    } else {
      setSelectedImages([...selectedImages, image])
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Tạo hình ảnh</TabsTrigger>
          <TabsTrigger value="selected">Đã chọn ({selectedImages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả hình ảnh</label>
            <Textarea
              placeholder="Mô tả chi tiết hình ảnh bạn muốn tạo..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phong cách hình ảnh</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phong cách" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Hiện đại</SelectItem>
                  <SelectItem value="cartoon">Hoạt hình</SelectItem>
                  <SelectItem value="realistic">Thực tế</SelectItem>
                  <SelectItem value="abstract">Trừu tượng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tỷ lệ khung hình</label>
              <Select value={ratio} onValueChange={setRatio}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tỷ lệ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Ngang)</SelectItem>
                  <SelectItem value="4:3">4:3 (Ngang)</SelectItem>
                  <SelectItem value="1:1">1:1 (Vuông)</SelectItem>
                  <SelectItem value="9:16">9:16 (Dọc)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Độ phân giải</label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn độ phân giải" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">HD (720p)</SelectItem>
                  <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                  <SelectItem value="4k">4K</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={!prompt || isGenerating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Tạo hình ảnh
                  </>
                )}
              </Button>
            </div>
          </div>

          {isGenerating ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((_, index) => (
                <div
                  key={index}
                  className="aspect-video bg-gray-100 rounded-md animate-pulse flex items-center justify-center"
                >
                  <p className="text-sm text-gray-400">Đang tạo...</p>
                </div>
              ))}
            </div>
          ) : generatedImages.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Kết quả</h3>
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tạo lại
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Generated image ${index + 1}`}
                      className={`w-full aspect-video object-cover rounded-md border-2 ${
                        selectedImages.includes(image) ? "border-green-500" : "border-transparent"
                      }`}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-white"
                        onClick={() => toggleImageSelection(image)}
                      >
                        {selectedImages.includes(image) ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="selected">
          {selectedImages.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Selected image ${index + 1}`}
                      className="w-full aspect-video object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                      <Button variant="outline" size="icon" className="bg-white">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-white"
                        onClick={() => toggleImageSelection(image)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button className="bg-green-600 hover:bg-green-700">Thêm vào video</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Chưa có hình ảnh nào được chọn</p>
              <p className="text-sm text-gray-400 mt-2">Tạo và chọn hình ảnh từ tab "Tạo hình ảnh"</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
