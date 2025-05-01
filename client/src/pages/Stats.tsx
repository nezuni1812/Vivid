"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { BarChart2, Facebook, Youtube } from 'lucide-react'
import FacebookStatsPage from "../pages/FacebookStatPage"
import TikTokStats from "../pages/TikTokStats"
import YouTubeStats from "../pages/StatPage"

type Platform = "youtube" | "facebook" | "tiktok"

export default function AnalyticsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("youtube")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value as Platform)
  }

  if (!isClient) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Thống kê Video</h1>
        </div>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-10">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-pink-500" />
            Thống kê theo nền tảng
          </CardTitle>
          <CardDescription>
            Xem thống kê chi tiết về hiệu suất video của bạn trên các nền tảng khác nhau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-1">
            <label className="block text-sm font-medium mb-2">Chọn nền tảng</label>
            <Select value={selectedPlatform} onValueChange={handlePlatformChange}>
              <SelectTrigger className="w-full sm:w-[300px] border-blue-200 focus:ring-blue-100">
                <SelectValue placeholder="Chọn nền tảng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube" className="flex items-center">
                  <div className="flex items-center">
                    <Youtube className="mr-2 h-4 w-4 text-red-500" />
                    <span>YouTube</span>
                  </div>
                </SelectItem>
                <SelectItem value="facebook">
                  <div className="flex items-center">
                    <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Facebook</span>
                  </div>
                </SelectItem>
                <SelectItem value="tiktok">
                  <div className="flex items-center">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M16.8217 5.1344C16.0886 4.29394 15.6479 3.19805 15.6479 2H14.7293M16.8217 5.1344C17.4898 5.90063 18.3944 6.45788 19.4245 6.67608C19.7446 6.74574 20.0786 6.78293 20.4266 6.78293V10.2191C18.645 10.2191 16.9932 9.64801 15.6477 8.68211V15.6707C15.6477 19.1627 12.8082 22 9.32386 22C7.50043 22 5.85334 21.2198 4.69806 19.98C3.64486 18.847 2.99994 17.3331 2.99994 15.6707C2.99994 12.2298 5.75592 9.42509 9.17073 9.35079M16.8217 5.1344C16.8039 5.12276 16.7861 5.11101 16.7684 5.09914M6.9855 17.3517C6.64217 16.8781 6.43802 16.2977 6.43802 15.6661C6.43802 14.0734 7.73249 12.7778 9.32394 12.7778C9.62087 12.7778 9.9085 12.8288 10.1776 12.9124V9.40192C9.89921 9.36473 9.61622 9.34149 9.32394 9.34149C9.27287 9.34149 8.86177 9.36884 8.81073 9.36884M14.7244 2H12.2097L12.2051 15.7775C12.1494 17.3192 10.8781 18.5591 9.32386 18.5591C8.35878 18.5591 7.50971 18.0808 6.98079 17.3564" stroke="#000000" stroke-linejoin="round"></path> </g></svg>
                    <span>TikTok</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="platform-stats-container">
        {selectedPlatform === "youtube" && <YouTubeStats />}
        {selectedPlatform === "facebook" && <FacebookStatsPage />}
        {selectedPlatform === "tiktok" && <TikTokStats />}
      </div>
    </div>
  )
}
