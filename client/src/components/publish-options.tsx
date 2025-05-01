"use client";

import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Download,
  Youtube,
  Facebook,
  Eye,
  Settings,
  FileText,
  Upload,
} from "lucide-react";

export default function PublishOptions() {
  const [quality, setQuality] = useState("1080p");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("export");
  const [activePlatform, setActivePlatform] = useState("youtube");

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        <Button
          variant={activeTab === "export" ? "default" : "outline"}
          onClick={() => setActiveTab("export")}
          className={
            activeTab === "export" ? "bg-green-600 hover:bg-green-700" : ""
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Xuất video
        </Button>
        <Button
          variant={activeTab === "preview" ? "default" : "outline"}
          onClick={() => setActiveTab("preview")}
          className={
            activeTab === "preview" ? "bg-purple-600 hover:bg-purple-700" : ""
          }
        >
          <Eye className="mr-2 h-4 w-4" />
          Xem trước
        </Button>
        <Button
          variant={activeTab === "publish" ? "default" : "outline"}
          onClick={() => setActiveTab("publish")}
          className={
            activeTab === "publish" ? "bg-blue-600 hover:bg-blue-700" : ""
          }
        >
          <Upload className="mr-2 h-4 w-4" />
          Xuất bản
        </Button>
      </div>

      {activeTab === "export" && (
        <Card>
          <CardHeader>
            <CardTitle>Cấu hình xuất video</CardTitle>
            <CardDescription>
              Chọn chất lượng và định dạng xuất video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chất lượng video</label>
              <Select
                value={quality}
                onValueChange={(value: string) => setQuality(value)}
              >
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
                <Button
                  variant="outline"
                  className="border-green-500 bg-green-50"
                >
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
      )}

      {activeTab === "preview" && (
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
          <CardFooter className="flex justify-between mt-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              Tiếp tục
            </Button>
          </CardFooter>
        </Card>
      )}

      {activeTab === "publish" && (
        <div>
          <div className="flex mb-6 border-b">
            <button
              className={`flex items-center px-4 py-2 border-b-2 ${
                activePlatform === "youtube"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActivePlatform("youtube")}
            >
              <Youtube className="mr-2 h-5 w-5" />
              YouTube
            </button>
            <button
              className={`flex items-center px-4 py-2 border-b-2 ${
                activePlatform === "tiktok"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActivePlatform("tiktok")}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M16.8217 5.1344C16.0886 4.29394 15.6479 3.19805 15.6479 2H14.7293M16.8217 5.1344C17.4898 5.90063 18.3944 6.45788 19.4245 6.67608C19.7446 6.74574 20.0786 6.78293 20.4266 6.78293V10.2191C18.645 10.2191 16.9932 9.64801 15.6477 8.68211V15.6707C15.6477 19.1627 12.8082 22 9.32386 22C7.50043 22 5.85334 21.2198 4.69806 19.98C3.64486 18.847 2.99994 17.3331 2.99994 15.6707C2.99994 12.2298 5.75592 9.42509 9.17073 9.35079M16.8217 5.1344C16.8039 5.12276 16.7861 5.11101 16.7684 5.09914M6.9855 17.3517C6.64217 16.8781 6.43802 16.2977 6.43802 15.6661C6.43802 14.0734 7.73249 12.7778 9.32394 12.7778C9.62087 12.7778 9.9085 12.8288 10.1776 12.9124V9.40192C9.89921 9.36473 9.61622 9.34149 9.32394 9.34149C9.27287 9.34149 8.86177 9.36884 8.81073 9.36884M14.7244 2H12.2097L12.2051 15.7775C12.1494 17.3192 10.8781 18.5591 9.32386 18.5591C8.35878 18.5591 7.50971 18.0808 6.98079 17.3564" stroke="#000000" stroke-linejoin="round"></path> </g></svg>
              TikTok
            </button>
            <button
              className={`flex items-center px-4 py-2 border-b-2 ${
                activePlatform === "facebook"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActivePlatform("facebook")}
            >
              <Facebook className="mr-2 h-5 w-5" />
              Facebook
            </button>
          </div>

          {activePlatform === "youtube" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tiêu đề video</label>
                <Input
                  placeholder="Nhập tiêu đề video..."
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  placeholder="Nhập mô tả video..."
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Tạo caption
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  Tải lên file caption
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Tùy chọn xuất bản</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="youtube-schedule" />
                    <label htmlFor="youtube-schedule" className="text-sm">
                      Lên lịch xuất bản
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="youtube-private" />
                    <label htmlFor="youtube-private" className="text-sm">
                      Đặt ở chế độ riêng tư
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="youtube-notify" />
                    <label htmlFor="youtube-notify" className="text-sm">
                      Thông báo khi xuất bản hoàn tất
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="youtube-comments" />
                    <label htmlFor="youtube-comments" className="text-sm">
                      Cho phép bình luận
                    </label>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-red-600 hover:bg-red-700 mt-4">
                Xuất bản lên YouTube
              </Button>
            </div>
          )}

          {activePlatform === "tiktok" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  placeholder="Nhập mô tả video cho TikTok..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Tạo caption
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  Tải lên file caption
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Tùy chọn xuất bản</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tiktok-private" />
                    <label htmlFor="tiktok-private" className="text-sm">
                      Đặt ở chế độ riêng tư
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tiktok-comments" />
                    <label htmlFor="tiktok-comments" className="text-sm">
                      Cho phép bình luận
                    </label>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-black hover:bg-gray-800 mt-4">
                Xuất bản lên TikTok
              </Button>
            </div>
          )}

          {activePlatform === "facebook" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tiêu đề bài đăng</label>
                <Input placeholder="Nhập tiêu đề bài đăng..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nội dung</label>
                <Textarea
                  placeholder="Nhập nội dung bài đăng..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Tạo caption
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  Tải lên file caption
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Tùy chọn xuất bản</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="facebook-schedule" />
                    <label htmlFor="facebook-schedule" className="text-sm">
                      Lên lịch xuất bản
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="facebook-friends" />
                    <label htmlFor="facebook-friends" className="text-sm">
                      Chỉ chia sẻ với bạn bè
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="facebook-notify" />
                    <label htmlFor="facebook-notify" className="text-sm">
                      Thông báo khi xuất bản hoàn tất
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="facebook-comments" />
                    <label htmlFor="facebook-comments" className="text-sm">
                      Cho phép bình luận
                    </label>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                Xuất bản lên Facebook
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
