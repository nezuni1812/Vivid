"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { X, LogOut } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"

declare global {
  interface Window {
    fbAsyncInit: () => void
    FB: any
  }
}

interface FacebookPage {
  id: string
  name: string
  access_token: string
}

interface UserAuth {
  isLoggedIn: boolean
  pages: FacebookPage[]
  selectedPageId?: string
}

const LOCAL_STORAGE_KEY = "facebook_stats_auth"

const FacebookUploader: React.FC = () => {
  const [isSdkLoaded, setSdkLoaded] = useState(false)
  const [authState, setAuthState] = useState<UserAuth>({
    isLoggedIn: false,
    pages: [],
  })
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [published, setPublished] = useState("public")
  const [isUploading, setIsUploading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load SDK
  useEffect(() => {
    if (window.FB) {
      setSdkLoaded(true)
      return
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v19.0",
      })

      setSdkLoaded(true)
    }

    const script = document.createElement("script")
    script.src = "https://connect.facebook.net/en_US/sdk.js"
    script.async = true
    document.body.appendChild(script)
  }, [])

  const handleLogin = () => {
  useEffect(() => {
    if (!isSdkLoaded) return

    const savedAuth = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedAuth) {
      const parsedAuth = JSON.parse(savedAuth)
      const selected = parsedAuth.pages.find((p: FacebookPage) => p.id === parsedAuth.selectedPageId)

      if (selected && parsedAuth.pages.length > 0) {
        // Validate token by making a test API call
        window.FB.api("/me", { access_token: selected.access_token }, (response: any) => {
          if (response.error) {
            console.error("Token validation failed:", response.error)
            handleLogout()
            setError("Your session has expired. Please log in again.")
          } else {
            setAuthState({
              isLoggedIn: true,
              pages: parsedAuth.pages,
              selectedPageId: parsedAuth.selectedPageId,
            })
            setSelectedPage(selected)
          }
        })
      } else {
        handleLogout()
      }
    }
  }, [isSdkLoaded])

  useEffect(() => {
    if (!isSdkLoaded) return
    if (authState.isLoggedIn) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          ...authState,
          selectedPageId: selectedPage?.id,
        })
      )
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }, [authState, selectedPage])

  const handleLogin = () => {
    if (!isSdkLoaded) {
      setError("Facebook SDK not loaded. Please refresh the page.")
      return
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          fetchPages()
        } else {
          setError("Đăng nhập thất bại. Vui lòng thử lại.")
        }
      },
      {
        scope:
          "pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,pages_manage_metadata,publish_video",
        auth_type: "rerequest",
      }
    )
  }

  const fetchPages = () => {
    window.FB.api("/me/accounts", "GET", {}, (response: any) => {
      if (response?.data && response.data.length > 0) {
        const pageList = response.data.map((page: any) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
        }))
        setAuthState({
          isLoggedIn: true,
          pages: pageList,
          selectedPageId: pageList[0].id,
        })
        setSelectedPage(pageList[0])
        setShowPopup(false)
      } else {
        setError("Không tìm thấy Trang Facebook. Bạn cần là quản trị viên của ít nhất một Trang.")
        handleLogout()
      }
    })
  }

  const handleLogout = () => {
    if (window.FB) {
      window.FB.logout(() => {
        resetAuthState()
      })
    } else {
      resetAuthState()
    }
  }

  const resetAuthState = () => {
    setAuthState({
      isLoggedIn: false,
      pages: [],
    })
    setSelectedPage(null)
    setShowPopup(false)
    setError(null)
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  const handleVideoUpload = async () => {
    if (!selectedPage) {
      setError("Vui lòng chọn một Trang trước khi đăng.")
      return
    }
    if (!videoFile && !videoUrl) {
      setError("Vui lòng chọn video từ thiết bị hoặc nhập URL video.")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      let fileToUpload = videoFile

      if (!fileToUpload && videoUrl) {
        const res = await fetch(videoUrl)
        if (!res.ok) {
          throw new Error("Không thể tải video từ URL.")
        }
        const blob = await res.blob()
        fileToUpload = new File([blob], "video.mp4", { type: blob.type })
      }

      const formData = new FormData()
      formData.append("file", fileToUpload!)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("access_token", selectedPage.access_token)
      formData.append("published", published === "public" ? "true" : "false")
      formData.append("privacy", JSON.stringify({"value": "EVERYONE"}));

      const res = await fetch(`https://graph-video.facebook.com/v19.0/${selectedPage.id}/videos`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json();
      if (data.id) {
        alert(` Đăng video thành công! ID: https://www.facebook.com/${selectedPage.id}/posts/${data.id}`)
        setShowPopup(false)
        setVideoFile(null)
        setVideoUrl("")
        setTitle("")
        setDescription("")
        setPublished("public")
      } else {
        console.error("Upload error:", data)
        if (data.error?.code === 190 && data.error?.error_subcode === 463) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
          handleLogout()
        } else {
          setError(`Đăng video thất bại: ${data.error?.message || "Lỗi không xác định"}`)
        }
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(`Có lỗi xảy ra khi đăng video: ${err instanceof Error ? err.message : "Lỗi không xác định"}`)
    } finally {
      setIsUploading(false)
    }
  }

  const closePopup = () => {
    setShowPopup(false)
    setError(null)
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardTitle className="text-2xl flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
            </svg>
            Đăng video lên Facebook Page
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {authState.isLoggedIn ? (
            <div className="flex flex-col gap-4">
              <Button onClick={() => setShowPopup(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Mở Form Đăng Video
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
                className="mr-2"
              >
                <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
              </svg>
              Đăng nhập Facebook
            </Button>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showPopup && authState.isLoggedIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={closePopup}>
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardTitle>Thông tin video</CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page-select">🔹 Chọn Page:</Label>
                <Select
                  value={selectedPage?.id || ""}
                  onValueChange={(value) => {
                    const page = authState.pages.find((p) => p.id === value)
                    if (page) {
                      setSelectedPage(page)
                    }
                  }}
                >
                  <SelectTrigger id="page-select">
                    <SelectValue placeholder="-- Chọn Page --" />
                  </SelectTrigger>
                  <SelectContent>
                    {authState.pages.length === 0 ? (
                      <SelectItem value="" disabled>
                        Không có trang nào
                      </SelectItem>
                    ) : (
                      authState.pages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-file">Chọn video từ thiết bị:</Label>
                <Input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    setVideoFile(e.target.files?.[0] || null)
                    setVideoUrl("")
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-url">Hoặc nhập URL video:</Label>
                <Input
                  id="video-url"
                  type="text"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value)
                    setVideoFile(null)
                  }}
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-title">Tiêu đề:</Label>
                <Input id="video-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-description">Mô tả:</Label>
                <Textarea
                  id="video-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Quyền riêng tư:</Label>
                <RadioGroup value={published} onValueChange={setPublished} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public">Công khai</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private">Riêng tư</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={closePopup}>
                Hủy
              </Button>
              <Button onClick={handleVideoUpload} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700">
                {isUploading ? "Đang đăng..." : "Đăng video"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

export default FacebookUploader
