"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Upload,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Link } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Skeleton } from "../components/ui/skeleton"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"

interface TikTokVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  engagementRate?: number
}

interface UserInfo {
  open_id: string
  union_id: string
  avatar_url: string
  display_name: string
  bio_description: string
  profile_deep_link: string
  is_verified: boolean
  username: string
  follower_count: number
  following_count: number
  likes_count: number
  video_count: number
}

type SortField = "publishedAt" | "viewCount" | "likeCount" | "commentCount" | "shareCount" | "engagementRate"
type SortDirection = "asc" | "desc"
type TimeRange = "7days" | "30days" | "90days" | "all"

const COLORS = ["#FF6B8A", "#4791FF", "#FFB572", "#41D87D", "#B18CFF"]

const TikTokStats = () => {
  const [videos, setVideos] = useState<TikTokVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("publishedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [timeRange, setTimeRange] = useState<TimeRange>("30days")
  const [refreshing, setRefreshing] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const videosPerPage = 10

  const accessToken = localStorage.getItem("tiktok_access_token")

  // Calculate engagement rate for each video
  const processedVideos = videos.map((video) => ({
    ...video,
    engagementRate: ((video.likeCount + video.commentCount + video.shareCount) / video.viewCount) * 100 || 0,
  }))

  // Calculate summary statistics
  const totalVideos = videos.length
  const totalViews = videos.reduce((acc, video) => acc + video.viewCount, 0)
  const totalLikes = videos.reduce((acc, video) => acc + video.likeCount, 0)
  const totalComments = videos.reduce((acc, video) => acc + video.commentCount, 0)
  const totalShares = videos.reduce((acc, video) => acc + (video.shareCount || 0), 0)
  const avgEngagementRate =
    totalViews > 0 ? (((totalLikes + totalComments + totalShares) / totalViews) * 100).toFixed(2) : "0"

  // Data for charts
  const viewsChartData = processedVideos
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 10)
    .map((video) => ({
      name: video.title.length > 20 ? video.title.substring(0, 20) + "..." : video.title,
      views: video.viewCount,
    }))

  const engagementChartData = [
    { name: "Likes", value: totalLikes },
    { name: "Comments", value: totalComments },
    { name: "Shares", value: totalShares },
  ]

  // Performance trend data (simulated for now)
  const trendData = [
    { date: "T2", views: 2400, likes: 1200, comments: 480 },
    { date: "T3", views: 1398, likes: 800, comments: 320 },
    { date: "T4", views: 9800, likes: 3908, comments: 1200 },
    { date: "T5", views: 3908, likes: 2000, comments: 800 },
    { date: "T6", views: 4800, likes: 2400, comments: 980 },
    { date: "T7", views: 3800, likes: 2300, comments: 800 },
    { date: "CN", views: 4300, likes: 2100, comments: 700 },
  ]

  // Pagination calculation
  const totalPages = Math.ceil(processedVideos.length / videosPerPage)
  const currentVideos = processedVideos
    .sort((a, b) => {
      if (sortField === "publishedAt") {
        return sortDirection === "desc"
          ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          : new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      } else {
        const aValue = a[sortField] || 0
        const bValue = b[sortField] || 0
        return sortDirection === "desc" ? bValue - aValue : aValue - bValue
      }
    })
    .slice((currentPage - 1) * videosPerPage, currentPage * videosPerPage)

  // Top performing video
  const topVideo =
    processedVideos.length > 0
      ? processedVideos.reduce((prev, current) => (prev.viewCount > current.viewCount ? prev : current))
      : null

  useEffect(() => {
    fetchTikTokVideos()
    fetchUserInfo()
  }, [timeRange])

  const fetchTikTokVideos = async () => {
    if (!accessToken) {
      setError("Không tìm thấy access token. Vui lòng đăng nhập vào TikTok.")
      setLoading(false)
      return
    }

    setRefreshing(true)

    try {
      const fields = [
        "id",
        "create_time",
        "title",
        "share_count",
        "view_count",
        "like_count",
        "comment_count",
        "cover_image_url",
      ].join(",")

      const now = new Date()
      let startDate = new Date()

      switch (timeRange) {
        case "7days":
          startDate.setDate(now.getDate() - 7)
          break
        case "30days":
          startDate.setDate(now.getDate() - 30)
          break
        case "90days":
          startDate.setDate(now.getDate() - 90)
          break
        case "all":
          startDate = new Date(0) // Beginning of time
          break
      }

      const response = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_count: 20, // Adjust as needed (max 20)
          // Filter by date if not "all"
          ...(timeRange !== "all" && {
            create_time_range: {
              start_time: Math.floor(startDate.getTime() / 1000),
              end_time: Math.floor(now.getTime() / 1000),
            },
          }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      if (data.data && data.data.videos) {
        setVideos(
          data.data.videos.map((video: any) => ({
            id: video.id,
            title: video.title || "Không có tiêu đề",
            thumbnail: video.cover_image_url || "/placeholder.svg?height=200&width=350",
            viewCount: video.view_count || 0,
            likeCount: video.like_count || 0,
            commentCount: video.comment_count || 0,
            shareCount: video.share_count || 0,
            publishedAt: new Date(video.create_time * 1000).toISOString(),
          })),
        )
      } else {
        setError("Không tìm thấy video nào")
      }
    } catch (error) {
      console.error("Lỗi khi tải video TikTok:", error)
      setError(`Lỗi khi tải dữ liệu: ${error instanceof Error ? error.message : "Lỗi không xác định"}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchUserInfo = async () => {
    if (!accessToken) {
      setError("Không tìm thấy access token. Vui lòng đăng nhập vào TikTok.")
      return
    }

    try {
      const fields = [
        "open_id",
        "union_id",
        "avatar_url",
        "display_name",
        "bio_description",
        "profile_deep_link",
        "is_verified",
        "username",
        "follower_count",
        "following_count",
        "likes_count",
        "video_count",
      ].join(",")

      const response = await fetch(
        `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      if (data.data && data.data.user) {
        setUserInfo(data.data.user)
      } else {
        setError("Không thể lấy thông tin người dùng")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lấy thông tin người dùng")
    } finally {
      setRefreshing(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleRefresh = () => {
    fetchTikTokVideos()
  }

  const renderSkeleton = () => (
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
  )

  if (loading && !refreshing)
    return (
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Thống kê Video TikTok</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        {renderSkeleton()}
      </div>
    )

  return (
    <div className="mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Thống kê Video TikTok</h1>

        <div className="flex flex-wrap gap-2">
          <Link to="/tiktok-upload">
            <Button className="flex items-center gap-2 bg-black hover:bg-gray-800">
              <Upload className="h-4 w-4" />
              Tải lên Video Mới
            </Button>
          </Link>

          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Đang tải..." : "Làm mới"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Khoảng thời gian</h2>
          <div className="flex gap-2">
            <Button
              variant={timeRange === "7days" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("7days")}
              className={timeRange === "7days" ? "bg-black hover:bg-gray-800" : ""}
            >
              7 ngày
            </Button>
            <Button
              variant={timeRange === "30days" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("30days")}
              className={timeRange === "30days" ? "bg-black hover:bg-gray-800" : ""}
            >
              30 ngày
            </Button>
            <Button
              variant={timeRange === "90days" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("90days")}
              className={timeRange === "90days" ? "bg-black hover:bg-gray-800" : ""}
            >
              90 ngày
            </Button>
            <Button
              variant={timeRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("all")}
              className={timeRange === "all" ? "bg-black hover:bg-gray-800" : ""}
            >
              Tất cả
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Tổng Video</p>
                <p className="text-2xl font-bold">{totalVideos}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-purple-500" />
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
                <p className="text-sm text-muted-foreground">Tỷ lệ Tương tác</p>
                <p className="text-2xl font-bold">{avgEngagementRate}%</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {userInfo && topVideo && (
        <Card className="mb-8 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-pink-500" />
              Video Hiệu Quả Nhất
            </CardTitle>
            <CardDescription>Video có lượt xem cao nhất trong khoảng thời gian đã chọn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={topVideo.thumbnail || "/placeholder.svg?height=200&width=350"}
                    alt={topVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-3 text-white">
                      <h3 className="font-bold line-clamp-2">{topVideo.title}</h3>
                      <p className="text-sm opacity-90">{new Date(topVideo.publishedAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Lượt xem</p>
                    <p className="text-2xl font-bold">{topVideo.viewCount.toLocaleString("vi-VN")}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Lượt thích</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{topVideo.likeCount.toLocaleString("vi-VN")}</p>
                      <Badge variant="secondary">{((topVideo.likeCount / topVideo.viewCount) * 100).toFixed(1)}%</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Bình luận</p>
                    <p className="text-2xl font-bold">{topVideo.commentCount.toLocaleString("vi-VN")}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Chia sẻ</p>
                    <p className="text-2xl font-bold">{topVideo.shareCount.toLocaleString("vi-VN")}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Tỷ lệ tương tác</p>
                    <p className="text-2xl font-bold">{topVideo.engagementRate?.toFixed(2)}%</p>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`https://www.tiktok.com/@${userInfo.username}/video/${topVideo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button variant="outline" className="bg-black text-white hover:bg-gray-800 border-none">
                        Xem trên TikTok
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={viewsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#000000" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Phân bố tương tác</CardTitle>
                <CardDescription>Tỷ lệ các loại tương tác</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {engagementChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Xu hướng hiệu suất</CardTitle>
              <CardDescription>Hiệu suất trong 7 ngày qua</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#000000" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="likes" stroke="#FF6B8A" />
                  <Line type="monotone" dataKey="comments" stroke="#41D87D" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          {/* Video Analytics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết Video</CardTitle>
              <CardDescription>Nhấp vào tiêu đề cột để sắp xếp</CardDescription>
            </CardHeader>
            <CardContent>
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
                      <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("viewCount")}>
                        <div className="flex items-center justify-end">
                          Lượt xem
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                          {sortField === "viewCount" && (
                            <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("likeCount")}>
                        <div className="flex items-center justify-end">
                          Lượt thích
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                          {sortField === "likeCount" && (
                            <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("commentCount")}>
                        <div className="flex items-center justify-end">
                          Bình luận
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                          {sortField === "commentCount" && (
                            <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("shareCount")}>
                        <div className="flex items-center justify-end">
                          Chia sẻ
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                          {sortField === "shareCount" && (
                            <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("engagementRate")}>
                        <div className="flex items-center justify-end">
                          Tỷ lệ tương tác
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                          {sortField === "engagementRate" && (
                            <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVideos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
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
                                href={`https://www.tiktok.com/video/${video.id}`}
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
                          <td className="p-3 text-right">{video.viewCount.toLocaleString("vi-VN")}</td>
                          <td className="p-3 text-right">{video.likeCount.toLocaleString("vi-VN")}</td>
                          <td className="p-3 text-right">{video.commentCount.toLocaleString("vi-VN")}</td>
                          <td className="p-3 text-right">{video.shareCount.toLocaleString("vi-VN")}</td>
                          <td className="p-3 text-right">
                            <Badge
                              variant={video.engagementRate > 5 ? "default" : "secondary"}
                              className={video.engagementRate > 5 ? "bg-black" : ""}
                            >
                              {video.engagementRate?.toFixed(2)}%
                            </Badge>
                          </td>
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
                    {Math.min(currentPage * videosPerPage, videos.length)} trong {videos.length} video
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          {/* Video Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Thư viện Video</CardTitle>
              <CardDescription>Tất cả video trong khoảng thời gian đã chọn</CardDescription>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  Không có video nào trong khoảng thời gian đã chọn
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="rounded-lg shadow-sm overflow-hidden border bg-card hover:shadow-md transition"
                    >
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
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                          <a
                            href={`https://www.tiktok.com/video/${video.id}`}
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
                            <span className="font-medium">{video.viewCount.toLocaleString("vi-VN")}</span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center">
                              <Heart className="h-4 w-4 mr-1" /> Lượt thích
                            </span>
                            <span className="font-medium">{video.likeCount.toLocaleString("vi-VN")}</span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" /> Bình luận
                            </span>
                            <span className="font-medium">{video.commentCount.toLocaleString("vi-VN")}</span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center">
                              <Share2 className="h-4 w-4 mr-1" /> Chia sẻ
                            </span>
                            <span className="font-medium">{video.shareCount.toLocaleString("vi-VN")}</span>
                          </div>

                          <div className="pt-2">
                            <p className="text-sm text-muted-foreground">Tỷ lệ tương tác</p>
                            <Progress value={Math.min(video.engagementRate || 0, 100)} className="h-2 mt-1 bg-gray-200">
                              <div
                                className="h-full bg-black"
                                style={{ width: `${Math.min(video.engagementRate || 0, 100)}%` }}
                              ></div>
                            </Progress>
                            <p className="text-right text-sm font-medium mt-1">{video.engagementRate?.toFixed(2)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TikTokStats;