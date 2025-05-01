"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
		BarChart,
		Bar,
		XAxis,
		YAxis,
		Tooltip,
		ResponsiveContainer,
		LineChart,
		CartesianGrid,
		Line,
		Legend,
} from "recharts"
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Youtube,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Skeleton } from "../components/ui/skeleton"

interface VideoItem {
		id: string
		title: string
		thumbnail: string
		publishedAt: string
		viewCount: string
		commentCount: string
		likeCount: string
}

interface VideoAnalytics {
		id: string
		title: string
		thumbnail: string
		publishedAt: string
		views: number
		watchTimeHours: number
		subscribers: number
}

interface AnalyticsData {
		date: string
		fullDate: string
		views: number
		watchTimeHours: number
		subscribers: number
}

interface ChannelInfo {
		id: string
		createdAt: string
}

type TimePeriod = "7" | "30" | "90" | "365" | "all" | "custom"
type SortField = "publishedAt" | "views" | "watchTimeHours" | "subscribers"
type SortDirection = "asc" | "desc"

const YoutubeStatPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn, accessToken, userId, signIn, isLoading } = useAuth()
  const [publishedVideo, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [videoAnalytics, setVideoAnalytics] = useState<VideoAnalytics[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30")
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  )
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null)

  // Thêm state loading riêng cho biểu đồ và bảng
  const [chartLoading, setChartLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)

  // Thêm state cho sắp xếp và phân trang
  const [sortField, setSortField] = useState<SortField>("publishedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const videosPerPage = 10

  const totalViews = publishedVideo.reduce((acc, video) => acc + Number.parseInt(video.viewCount), 0)
  const totalComments = publishedVideo.reduce((acc, video) => acc + Number.parseInt(video.commentCount), 0)
  const totalLikes = publishedVideo.reduce((acc, video) => acc + Number.parseInt(video.likeCount || "0"), 0)

  // Dữ liệu cho biểu đồ cột
  const chartData = publishedVideo.map((video) => ({
    name: video.title.length > 20 ? video.title.substring(0, 20) + "..." : video.title,
    views: Number.parseInt(video.viewCount),
  }))

  // Tính tổng số trang
  const totalPages = Math.ceil(videoAnalytics.length / videosPerPage)

  // Lấy video cho trang hiện tại
  const currentVideos = videoAnalytics
    .sort((a, b) => {
      if (sortField === "publishedAt") {
        return sortDirection === "desc"
          ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          : new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      } else {
        const aValue = a[sortField]
        const bValue = b[sortField]
        return sortDirection === "desc"
          ? (bValue as number) - (aValue as number)
          : (aValue as number) - (bValue as number)
      }
    })
    .slice((currentPage - 1) * videosPerPage, currentPage * videosPerPage)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        if (isLoading) return
        if (!isSignedIn || !accessToken || !userId) {
          setError("Vui lòng đăng nhập tài khoản YouTube để xem thống kê")
          navigate("/")
          setLoading(false)
          return
        }

        // Lấy thông tin kênh của người dùng hiện tại
        const channelRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&mine=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        const channelData = await channelRes.json()
        const channelId = channelData.items?.[0]?.id
        const channelCreatedAt = channelData.items?.[0]?.snippet?.publishedAt

        if (!channelId) {
          setError("Không tìm thấy kênh YouTube. Có thể tài khoản này chưa đăng kí kênh Youtube")
          setLoading(false)
          return
        }

        // Lưu thông tin kênh
        setChannelInfo({
          id: channelId,
          createdAt: channelCreatedAt,
        })

        // // Lấy playlistId của video uploads
        const uploadsListId = channelData.items[0].contentDetails.relatedPlaylists.uploads

        // Lấy danh sách video trong uploads playlist
        const playlistRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsListId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        const playlistData = await playlistRes.json()

        const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId)

        // Lấy thông tin chi tiết video
        const videoStatsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        const videoStatsResJson = await videoStatsRes.json()
        const videoList: VideoItem[] = videoStatsResJson.items.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          publishedAt: item.snippet.publishedAt,
          viewCount: item.statistics.viewCount || "0",
          commentCount: item.statistics.commentCount || "0",
          likeCount: item.statistics.likeCount || "0",
        }))
        setVideos(videoList)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError("Đã xảy ra lỗi khi lấy dữ liệu video.")
        setLoading(false)
      }
    }

    fetchVideos()
  }, [accessToken])

  useEffect(() => {
    if (channelInfo) {
      fetchAnalyticsData()
      fetchVideoAnalytics()
    }
  }, [channelInfo, selectedPeriod, customStartDate, customEndDate, publishedVideo])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedPeriod, customStartDate, customEndDate, sortField, sortDirection])

  const fetchAnalyticsData = async () => {
    if (!accessToken || !channelInfo || publishedVideo.length === 0) return

    try {
      setChartLoading(true)

      let startDate: string
      let endDate = new Date().toISOString().split("T")[0]

      if (selectedPeriod === "custom") {
        startDate = customStartDate
        endDate = customEndDate
      } else if (selectedPeriod === "all") {
        startDate = new Date(channelInfo.createdAt).toISOString().split("T")[0]
      } else {
        const days = Number.parseInt(selectedPeriod)
        startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      }

      const videoIds = publishedVideo.map((video) => video.id).join(",")
      console.log("videoIds: ", videoIds)
      const analyticsRes = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?dimensions=day&metrics=views,estimatedMinutesWatched,subscribersGained&sort=day&startDate=${startDate}&endDate=${endDate}&ids=channel==${channelInfo.id}&filters=video==${videoIds}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      const analyticsData = await analyticsRes.json()

      if (analyticsData.error) {
        throw new Error(analyticsData.error.message || "Error fetching analytics data")
      }

      const formattedData: AnalyticsData[] = []

      if (analyticsData.rows && analyticsData.rows.length > 0) {
        analyticsData.rows.forEach((row: any) => {
          const [date, views, watchTimeMinutes, subscribers] = row

          const formattedDate = new Date(date).toLocaleDateString("vi-VN", {
            month: "short",
            day: "numeric",
          })

          const fullDate = new Date(date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })

          formattedData.push({
            date: formattedDate,
            fullDate: fullDate,
            views: views,
            watchTimeHours: Math.round((watchTimeMinutes / 60) * 10) / 10,
            subscribers: subscribers,
          })
        })
      }

      setAnalyticsData(formattedData)
      setChartLoading(false)
    } catch (err) {
      console.error("Analytics error:", err)
      setError("Đã xảy ra lỗi khi lấy dữ liệu phân tích.")
      setChartLoading(false)
    }
  }

  const fetchVideoAnalytics = async () => {
    if (!accessToken || !channelInfo || publishedVideo.length === 0) return

    try {
      setTableLoading(true)

      let startDate: string
      let endDate = new Date().toISOString().split("T")[0]

      if (selectedPeriod === "custom") {
        startDate = customStartDate
        endDate = customEndDate
      } else if (selectedPeriod === "all") {
        startDate = new Date(channelInfo.createdAt).toISOString().split("T")[0]
      } else {
        const days = Number.parseInt(selectedPeriod)
        startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      }

      const videoIds = publishedVideo.map((video) => video.id).join(",")

      const videoAnalyticsRes = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?dimensions=video&metrics=views,estimatedMinutesWatched,subscribersGained&sort=-views&startDate=${startDate}&endDate=${endDate}&ids=channel==${channelInfo.id}&filters=video==${videoIds}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      const videoAnalyticsData = await videoAnalyticsRes.json()

      if (videoAnalyticsData.error) {
        throw new Error(videoAnalyticsData.error.message || "Error fetching video analytics data")
      }

      const formattedVideoData: VideoAnalytics[] = []

      if (videoAnalyticsData.rows && videoAnalyticsData.rows.length > 0) {
        videoAnalyticsData.rows.forEach((row: any) => {
          const [videoId, views, watchTimeMinutes, subscribers] = row

          const videoInfo = publishedVideo.find((v) => v.id === videoId)

          if (videoInfo) {
            formattedVideoData.push({
              id: videoId,
              title: videoInfo.title,
              thumbnail: videoInfo.thumbnail,
              publishedAt: videoInfo.publishedAt,
              views: views,
              watchTimeHours: Math.round((watchTimeMinutes / 60) * 10) / 10,
              subscribers: subscribers,
            })
          }
        })
      }

      setVideoAnalytics(formattedVideoData)
      setTableLoading(false)
    } catch (err) {
      console.error("Video analytics error:", err)
      setError("Đã xảy ra lỗi khi lấy dữ liệu phân tích video.")
      setTableLoading(false)
    }
  }

  const handlePeriodChange = (period: TimePeriod) => (e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedPeriod(period)
  }

  // Hàm xử lý sắp xếp
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Nếu đang sắp xếp theo field này, đổi hướng sắp xếp
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Nếu sắp xếp theo field mới, mặc định là desc
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Tùy chỉnh tooltip để hiển thị ngày đầy đủ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-bold">{dataPoint.fullDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading)
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Thống kê Video YouTube</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Thống kê Video YouTube</h1>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => {}} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Tổng Video</p>
                <p className="text-2xl font-bold">{publishedVideo.length}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <Youtube className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Tổng Lượt Xem</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString("vi-VN")}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-pink-50 border-pink-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Tổng Lượt Thích</p>
                <p className="text-2xl font-bold">{totalLikes.toLocaleString("vi-VN")}</p>
              </div>
              <div className="bg-pink-100 p-2 rounded-full">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Tổng Bình Luận</p>
                <p className="text-2xl font-bold">{totalComments.toLocaleString("vi-VN")}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Khoảng thời gian</h2>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === "7" ? "default" : "outline"}
              size="sm"
              onClick={handlePeriodChange("7")}
              className={selectedPeriod === "7" ? "bg-red-500 hover:bg-red-600" : ""}
            >
              7 ngày
            </Button>
            <Button
              variant={selectedPeriod === "30" ? "default" : "outline"}
              size="sm"
              onClick={handlePeriodChange("30")}
              className={selectedPeriod === "30" ? "bg-red-500 hover:bg-red-600" : ""}
            >
              30 ngày
            </Button>
            <Button
              variant={selectedPeriod === "90" ? "default" : "outline"}
              size="sm"
              onClick={handlePeriodChange("90")}
              className={selectedPeriod === "90" ? "bg-red-500 hover:bg-red-600" : ""}
            >
              90 ngày
            </Button>
            <Button
              variant={selectedPeriod === "all" ? "default" : "outline"}
              size="sm"
              onClick={handlePeriodChange("all")}
              className={selectedPeriod === "all" ? "bg-red-500 hover:bg-red-600" : ""}
            >
              Tất cả
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="charts" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts">Biểu đồ</TabsTrigger>
          <TabsTrigger value="table">Bảng dữ liệu</TabsTrigger>
          <TabsTrigger value="cards">Thẻ video</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Views Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Lượt xem theo Video</CardTitle>
                <CardDescription>10 video có lượt xem cao nhất</CardDescription>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng hiệu suất</CardTitle>
                <CardDescription>Hiệu suất trong khoảng thời gian đã chọn</CardDescription>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                  </div>
                ) : analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#ef4444" activeDot={{ r: 8 }} name="Lượt xem" />
                      <Line type="monotone" dataKey="subscribers" stroke="#3b82f6" name="Người đăng ký mới" />
                      <Line type="monotone" dataKey="watchTimeHours" stroke="#10b981" name="Giờ xem (h)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Không có dữ liệu cho khoảng thời gian đã chọn</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="table">
          {/* Video Analytics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết Video</CardTitle>
              <CardDescription>Nhấp vào tiêu đề cột để sắp xếp</CardDescription>
            </CardHeader>
            <CardContent>
              {tableLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="p-3 text-left">Video</th>
                          <th className="p-3 text-left cursor-pointer" onClick={() => handleSort("publishedAt")}>
                            <div className="flex items-center">
                              Ngày đăng
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                              {sortField === "publishedAt" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("views")}>
                            <div className="flex items-center justify-end">
                              Lượt xem
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                              {sortField === "views" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("watchTimeHours")}>
                            <div className="flex items-center justify-end">
                              Giờ xem
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                              {sortField === "watchTimeHours" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("subscribers")}>
                            <div className="flex items-center justify-end">
                              Người đăng ký
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                              {sortField === "subscribers" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentVideos.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                              Không có dữ liệu video nào trong khoảng thời gian đã chọn
                            </td>
                          </tr>
                        ) : (
                          currentVideos.map((video) => (
                            <tr key={video.id} className="border-b hover:bg-muted/30">
                              <td className="p-3">
                                <div className="flex items-center space-x-3">
                                  <div className="relative w-16 h-9 overflow-hidden rounded">
                                    <img
                                      src={video.thumbnail || "/placeholder.svg?height=200&width=350"}
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <a
                                    href={`https://www.youtube.com/watch?v=${video.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary hover:underline line-clamp-2"
                                  >
                                    {video.title}
                                  </a>
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                {new Date(video.publishedAt).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              <td className="p-3 text-right">{video.views.toLocaleString("vi-VN")}</td>
                              <td className="p-3 text-right">{video.watchTimeHours.toLocaleString("vi-VN")}</td>
                              <td className="p-3 text-right">{video.subscribers.toLocaleString("vi-VN")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                      <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * videosPerPage + 1} đến{" "}
                        {Math.min(currentPage * videosPerPage, videoAnalytics.length)} trong {videoAnalytics.length}{" "}
                        video
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Tiếp <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          {/* Video Cards */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {publishedVideo.length === 0 ? (
              <div className="col-span-full text-center p-8 text-muted-foreground">
                Không có video nào trong khoảng thời gian đã chọn
              </div>
            ) : (
              publishedVideo.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-md transition">
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnail || "/placeholder.svg?height=200&width=350"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white">
                        {new Date(video.publishedAt).toLocaleDateString("vi-VN")}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {video.title}
                      </a>
                    </h3>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <Eye className="h-4 w-4 mr-1" /> Lượt xem
                        </span>
                        <span className="font-medium">{Number.parseInt(video.viewCount).toLocaleString("vi-VN")}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <Heart className="h-4 w-4 mr-1" /> Lượt thích
                        </span>
                        <span className="font-medium">
                          {Number.parseInt(video.likeCount || "0").toLocaleString("vi-VN")}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" /> Bình luận
                        </span>
                        <span className="font-medium">
                          {Number.parseInt(video.commentCount).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default YoutubeStatPage;