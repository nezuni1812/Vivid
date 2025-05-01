"use client"

import type React from "react"
import { useWorkspace } from "../context/WorkspaceContext";
import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Wand2, Upload, FileText, X, Loader2 } from "lucide-react"
import axios from "axios"
import { LanguageSelect } from "./custom-language-select"

const suggestedTopics = [
  "Vũ trụ",
  "Tế bào",
  "Vật lý lượng tử cơ bản",
  "Hóa học hữu cơ",
  "Sinh học tiến hóa",
  "Khoa học thần kinh",
  "Biến đổi khí hậu",
  "Trí tuệ nhân tạo",
]

export default function ScriptGenerator({workspace_id}:{workspace_id:string}) {
  const [topic, setTopic] = useState("")
  const [style, setStyle] = useState("general")
  const [generatedScript, setGeneratedScript] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [language, setLanguage] = useState("vietnamese")
  const [wordCount, setWordCount] = useState<number>(100)
  const { workspaceId, scriptId, setScriptId } = useWorkspace();


  const handleTopicSelect = (selectedTopic: string) => {
    setTopic(selectedTopic)
  }

  const generateScriptFromAI = async () => {
    if (!topic) return

    setIsGenerating(true)

    try {
      const response = await axios.post("http://127.0.0.1:5000/scripts/generate", {
        workspace_id: workspace_id,
        title: topic,
        style: style,
        length: wordCount, // Sử dụng wordCount thay vì giá trị cố định 1000
        language: language,
      })

      if (response.data?.script) {
        setGeneratedScript(response.data.script)
        setScriptId(response.data.id) // Lưu script_id
      } else {
        throw new Error("Phản hồi API không chứa kịch bản")
      }
    } catch (error) {
      console.error("Error generating script from AI:", error)
      alert("Không thể tạo kịch bản từ AI. Sử dụng mẫu mặc định.")
      generateScriptTemplate()
    } finally {
      setIsGenerating(false)
    }
  }

  // Rename your current template-based generation to make it a fallback
  const generateScriptTemplate = () => {
    const scripts = {
      children: `# Video Khoa học cho trẻ em: ${topic}
      
      // ...existing template code...`,
      general: `// ...existing template code...`,
      advanced: `// ...existing template code...`,
    }

    setGeneratedScript(scripts[style as keyof typeof scripts])
  }

  // Update your existing generateScript function to use the AI version
  const generateScript = () => {
    if (!topic) return
    generateScriptFromAI()
  }

  const completeScript = async () => {
    if (!scriptId) {
      alert("Không có kịch bản nào để hoàn thành. Vui lòng tạo kịch bản trước.")
      return
    }

    try {
      const response = await axios.post(`http://127.0.0.1:5000/scripts/${scriptId}/complete`, {
        new_script: generatedScript,
      })
      if (response.status === 200) {
        alert(response.data.message || "Kịch bản đã được cập nhật và hoàn thành!")
      } else {
        throw new Error("Phản hồi API không hợp lệ")
      }
    } catch (error: any) {
      console.error("Error completing script:", error)
      alert(error.response?.data?.error || "Đã xảy ra lỗi khi hoàn thành kịch bản.")
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      // Đặt lại chiều cao về auto để tính toán lại chiều cao thực tế
      textareaRef.current.style.height = "auto"
      // Đặt chiều cao bằng với scrollHeight để hiển thị tất cả nội dung
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [generatedScript])

  // Xử lý khi người dùng thay đổi nội dung textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedScript(e.target.value)
    // Điều chỉnh chiều cao
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  // Xử lý tải file lên
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Kiểm tra định dạng file
      const fileExt = file.name.split(".").pop()?.toLowerCase()
      if (fileExt === "docx" || fileExt === "pdf") {
        setSelectedFile(file)
      } else {
        alert("Chỉ chấp nhận file .docx hoặc .pdf")
        e.target.value = ""
      }
    }
  }

  const handleUploadToServer = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn một tệp để tải lên")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("workspace_id", workspace_id) // Replace with actual workspace ID from context/props
      formData.append("style", style) // Add the current style

      formData.append("language", language);

      // Send to server
      const response = await axios.post("http://127.0.0.1:5000/generate-script-from-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Handle success
      if (response.data && response.data.script) {
        setGeneratedScript(response.data.script)
        setScriptId(response.data.id)
        // Set a topic based on the file name (optional)
        if (response.data.title) {
          setTopic(response.data.title)
        }
      }
    } catch (error: any) {
      console.error("Error uploading file:", error)
      setUploadError(error.response?.data?.error || "Đã xảy ra lỗi khi xử lý tệp")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUploadClick = () => {
    fileInputRef.current?.click()
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Chủ đề khoa học {workspace_id}</label>
        <div className="flex gap-2">
          <Textarea
            placeholder="Nhập chủ đề khoa học..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 min-h-[60px] resize-none"
          />
          <Button onClick={generateScript} disabled={!topic || isGenerating}>
            <Wand2 className="mr-2 h-4 w-4" />
            Tạo kịch bản
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Chọn từ danh sách gợi ý</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {suggestedTopics.map((suggestedTopic) => (
            <Button
              key={suggestedTopic}
              variant="outline"
              onClick={() => handleTopicSelect(suggestedTopic)}
              className={topic === suggestedTopic ? "border-green-500 bg-green-50" : ""}
            >
              {suggestedTopic}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phong cách nội dung</label>
        <Select value={style} onValueChange={setStyle}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn phong cách nội dung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="children">Trẻ em</SelectItem>
            <SelectItem value="general">Phổ thông</SelectItem>
            <SelectItem value="advanced">Chuyên sâu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <LanguageSelect value={language} onChange={setLanguage} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Số lượng từ trong kịch bản</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={100}
            value={wordCount}
            onChange={(e) => setWordCount(Number.parseInt(e.target.value) || 100)}
            className="flex-1"
          />
          <span className="text-sm text-gray-500">từ</span>
        </div>
        <p className="text-xs text-gray-500">Nhập số lượng từ mong muốn cho kịch bản của bạn (tối thiểu 100)</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tải lên kịch bản có sẵn</label>
        <div
          className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
          onClick={handleFileUploadClick}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".docx,.pdf" className="hidden" />
          {!selectedFile ? (
            <>
              <Upload className="h-6 w-6 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Nhấp để tải lên hoặc kéo và thả file .docx, .pdf</p>
              <p className="text-xs text-gray-400 mt-1">Kích thước tối đa: ...MB</p>
            </>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium truncate max-w-xs">{selectedFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSelectedFile()
                }}
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          )}
        </div>
        {selectedFile && (
          <div className="mt-2">
            <Button
              onClick={handleUploadToServer}
              disabled={isUploading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý tệp...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Trích xuất nội dung kịch bản
                </>
              )}
            </Button>
            {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
          </div>
        )}
      </div>

      {isGenerating ? (
        <div className="h-60 flex items-center justify-center border rounded-md bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Đang tạo kịch bản...</p>
          </div>
        </div>
      ) : generatedScript ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Kịch bản đã tạo</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Tạo lại
              </Button>
              { <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={completeScript}
                disabled={!scriptId}
              >
                Lưu kịch bản
              </Button> }
            </div>
          </div>
          <Textarea
            value={generatedScript}
            onChange={(e) => setGeneratedScript(e.target.value)}
            className="min-h-[300px] font-mono"
          />
        </div>
      ) : null}
    </div>
  )
}
