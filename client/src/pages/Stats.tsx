"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { BarChart2, Facebook, Youtube, Instagram } from 'lucide-react'
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
                    <Instagram className="mr-2 h-4 w-4" />
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
