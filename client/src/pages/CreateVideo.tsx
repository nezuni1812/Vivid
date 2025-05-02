"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import ScriptGenerator from "../components/script-generator"
import VoiceConfig from "../components/voice-config"
import ImageGenerator from "../components/image-generator"
import VideoEditor from "../components/video-editor"
import PublishOptions from "../components/publish-options"
import { useNavigate } from "react-router-dom"
import { useWorkspace } from "../context/WorkspaceContext";
import PublishOptionsDialog from "../components/publish-options-dialog"

const steps = [
  { id: "content", label: "Nội dung" },
  { id: "publish", label: "Xuất bản" },
]

export default function CreateVideo() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState("content")

  const scriptRef = useRef<HTMLDivElement>(null)
  const voiceRef = useRef<HTMLDivElement>(null)
  const imagesRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  
  const { scriptId } = useWorkspace(); // Get scriptId from context

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
      if (ref.current) {
        ref.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }

  return (
    <main className="max-w-[45rem] container mx-auto py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
      <PublishOptionsDialog />
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="mr-2"
            onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Tạo Video Mới</h1>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Save className="mr-2 h-4 w-4" />
          Lưu dự thảo
        </Button>
      </div>

      <div className="mb-8">
        <Tabs value={activeStep} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            {steps.map((step) => (
              <TabsTrigger key={step.id} value={step.id} onClick={() => setActiveStep(step.id)}>
                {step.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="content" className="space-y-8">
            {/* Navigation buttons for sections */}
            <div className="flex justify-between bg-gray-50 p-3 rounded-lg sticky top-0 z-10 border shadow-sm">
              <Button variant="outline" onClick={() => scrollToSection(scriptRef)}>
                Kịch bản
              </Button>
              <Button variant="outline" onClick={() => scrollToSection(voiceRef)}>
                Giọng nói
              </Button>
              <Button variant="outline" onClick={() => scrollToSection(imagesRef)}>
                Hình ảnh
              </Button>
              <Button variant="outline" onClick={() => scrollToSection(editorRef)}>
                Chỉnh sửa
              </Button>
            </div>

            {/* Script Section */}
            <div ref={scriptRef}>
              <Card>
                <CardHeader>
                  <CardTitle>Tạo kịch bản video khoa học</CardTitle>
                  <CardDescription>Nhập chủ đề khoa học hoặc chọn từ danh sách gợi ý</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScriptGenerator />
                </CardContent>
              </Card>
            </div>

            {/* Voice Section */}
            <div ref={voiceRef}>
              <Card>
                <CardHeader>
                  <CardTitle>Cấu hình giọng nói</CardTitle>
                  <CardDescription>Lựa chọn và tùy chỉnh giọng nói cho video của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <VoiceConfig />
                </CardContent>
              </Card>
            </div>

            {/* Images Section */}
            <div ref={imagesRef}>
              <Card>
                <CardHeader>
                  <CardTitle>Tạo hình ảnh và video</CardTitle>
                  <CardDescription>Tạo và tùy chỉnh hình ảnh minh họa cho video</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageGenerator />
                </CardContent>
              </Card>
            </div>

            {/* Editor Section */}
            <div ref={editorRef}>
              <Card>
                <CardHeader>
                  <CardTitle>Trình chỉnh sửa video</CardTitle>
                  <CardDescription>Chỉnh sửa và sắp xếp các phần của video</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <VideoEditor />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setActiveStep("publish")} className="bg-green-600 hover:bg-green-700">
                Tiếp tục đến xuất bản
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="publish">
            <Card>
              <CardHeader>
                <CardTitle>Xuất bản và quản lý nội dung</CardTitle>
                <CardDescription>Cấu hình xuất bản và chia sẻ video của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <PublishOptions />
              </CardContent>
            </Card>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setActiveStep("content")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại chỉnh sửa
              </Button>

              <Button className="bg-green-600 hover:bg-green-700">Hoàn thành</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
