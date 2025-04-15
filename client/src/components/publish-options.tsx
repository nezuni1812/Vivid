"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "./ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Download, Youtube, Facebook, InstagramIcon as BrandTiktok, Eye, Settings } from "lucide-react"

export default function PublishOptions() {
  const [quality, setQuality] = useState("1080p")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [platforms, setPlatforms] = useState<string[]>([])

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter((p) => p !== platform))
    } else {
      setPlatforms([...platforms, platform])
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="export">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">Xuất video</TabsTrigger>
          <TabsTrigger value="preview">Xem trước</TabsTrigger>
          <TabsTrigger value="publish">Xuất bản</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình xuất video</CardTitle>
              <CardDescription>Chọn chất lượng và định dạng xuất video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chất lượng video</label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chất lượng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">HD (720p)</SelectItem>
                    <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                    <SelectItem value="4k">4K Ultra HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Định dạng</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="border-green-500 bg-green-50">
                    MP4
                  </Button>
                  <Button variant="outline">MOV</Button>
                  <Button variant="outline">WebM</Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tùy chọn nâng cao</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="optimize" />
                    <label htmlFor="optimize" className="text-sm">
                      Tối ưu hóa cho web
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="compress" />
                    <label htmlFor="compress" className="text-sm">
                      Nén video (kích thước nhỏ hơn)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="watermark" />
                    <label htmlFor="watermark" className="text-sm">
                      Thêm watermark
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" />
                Xuất video
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Xem trước video</CardTitle>
              <CardDescription>Kiểm tra video trước khi xuất bản</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <img
                  src="/placeholder.svg?height=720&width=1280"
                  alt="Video preview"
                  className="w-full h-full object-contain"
                />
                <div className="absolute">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 h-16 w-16"
                  >
                    <Eye className="h-8 w-8 text-white" />
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">Tiếp tục</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="publish" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tiêu đề video</label>
              <Input placeholder="Nhập tiêu đề video..." value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                placeholder="Nhập mô tả video..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nền tảng xuất bản</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className={`flex items-center justify-start ${
                    platforms.includes("youtube") ? "border-red-500 bg-red-50" : ""
                  }`}
                  onClick={() => togglePlatform("youtube")}
                >
                  <Youtube className="mr-2 h-4 w-4 text-red-600" />
                  YouTube
                </Button>
                <Button
                  variant="outline"
                  className={`flex items-center justify-start ${
                    platforms.includes("tiktok") ? "border-black bg-gray-50" : ""
                  }`}
                  onClick={() => togglePlatform("tiktok")}
                >
                  <BrandTiktok className="mr-2 h-4 w-4" />
                  TikTok
                </Button>
                <Button
                  variant="outline"
                  className={`flex items-center justify-start ${
                    platforms.includes("facebook") ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => togglePlatform("facebook")}
                >
                  <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                  Facebook
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tùy chọn xuất bản</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="schedule" />
                  <label htmlFor="schedule" className="text-sm">
                    Lên lịch xuất bản
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="private" />
                  <label htmlFor="private" className="text-sm">
                    Đặt ở chế độ riêng tư
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="notify" />
                  <label htmlFor="notify" className="text-sm">
                    Thông báo khi xuất bản hoàn tất
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-700">Xuất bản video</Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
