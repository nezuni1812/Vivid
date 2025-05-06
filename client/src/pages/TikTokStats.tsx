"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
import TikTokLogin from "./TikTokLogin"

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
  const [filteredVideos, setFilteredVideos] = useState<TikTokVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("publishedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [timeRange, setTimeRange] = useState<TimeRange>("30days")
  const [refreshing, setRefreshing] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const videosPerPage = 10
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("tiktok_access_token"));

  // Hàm lọc video theo thời gian
  const filterVideosByTimeRange = (videos: TikTokVideo[], range: TimeRange) => {
    const now = new Date()
    let startDate = new Date()

    switch (range) {
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
        return videos
    }

    return videos.filter((video) => new Date(video.publishedAt) >= startDate)
  }

  // Xử lý dữ liệu video
  const processedVideos = filteredVideos.map((video) => ({
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

  // Dữ liệu cho biểu đồ cột
  const chartData = processedVideos
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 10)
    .map((video) => ({
      name: video.title.length > 20 ? video.title.substring(0, 20) + "..." : video.title,
      views: video.viewCount,
    }))

  // Pagination calculation
  const performanceData = processedVideos
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10)
    .map((video) => ({
      name: video.title.length > 20 ? video.title.substring(0, 20) + "..." : video.title,
      views: video.viewCount,
      likes: video.likeCount,
      comments: video.commentCount,
    }))

  // Phân trang
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
    if (accessToken) {
      setLoading(true);
      Promise.all([fetchTikTokVideos(accessToken), fetchUserInfo(accessToken)]).then(() => {
        setLoading(false);
      });
    }
  }, [accessToken]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const { accessToken, error, error_type } = event.data;
      if (error) {
        setError(`Đăng nhập TikTok thất bại: ${error} (${error_type || "Unknown error type"})`);
        return;
      }
      if (accessToken) {
        localStorage.setItem("tiktok_access_token", accessToken);
        setAccessToken(accessToken); 
        setLoading(true);
        await Promise.all([fetchTikTokVideos(accessToken), fetchUserInfo(accessToken)]);
      }
    };
  
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    setFilteredVideos(filterVideosByTimeRange(videos, timeRange))
    setCurrentPage(1)
  }, [timeRange, videos])

  const fetchTikTokVideos = async (token: string) => {
    if (!token) {
      setError("Không tìm thấy access token. Vui lòng đăng nhập vào TikTok.")
      setLoading(false)
      return
    }

    setRefreshing(true)
    setChartLoading(true)
    setTableLoading(true)

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

      const response = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_count: 20,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      if (data.data && data.data.videos) {
        const fetchedVideos = data.data.videos.map((video: any) => ({
          id: video.id,
          title: video.title || "Không có tiêu đề",
          thumbnail: video.cover_image_url || "/placeholder.svg?height=200&width=350",
          viewCount: video.view_count || 0,
          likeCount: video.like_count || 0,
          commentCount: video.comment_count || 0,
          shareCount: video.share_count || 0,
          publishedAt: new Date(video.create_time * 1000).toISOString(),
        }))
        setVideos(fetchedVideos)
        setFilteredVideos(filterVideosByTimeRange(fetchedVideos, timeRange))
      } else {
        setError("Không tìm thấy video nào")
      }
    } catch (error) {
      console.error("Lỗi khi tải video TikTok:", error)
      setError(`Lỗi khi tải dữ liệu: ${error instanceof Error ? error.message : "Lỗi không xác định"}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setChartLoading(false)
      setTableLoading(false)
    }
  }

  const fetchUserInfo = async (token: string) => {
    if (!token) {
      setError("Không tìm thấy access token. Vui lòng đăng nhập vào TikTok.");
      return;
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
            Authorization: `Bearer ${token}`,
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
    if (accessToken) {
      fetchTikTokVideos(accessToken)
    }
  }

  const handlePeriodChange = (range: TimeRange) => () => {
    setTimeRange(range)
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

  if (loading && !refreshing && accessToken)
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

      {!accessToken || !userInfo ? (
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Chào mừng đến với Thống kê Video TikTok</CardTitle>
            <CardDescription>
              Kết nối tài khoản TikTok của bạn để xem phân tích chi tiết cho video trên Kênh của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center mx-auto w-60">
            <TikTokLogin/>
          </CardContent>
        </Card>
      ) : (
        <>
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

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Khoảng thời gian</h2>
          <div className="flex gap-2">
            <Button
              variant={timeRange === "7days" ? "default" : "outline"}
              size="sm"
              onClick={handlePeriodChange("7days")}
              className={timeRange === "7days" ? "bg-black hover:bg-gray-800" : ""}
            >
              7 ngày
            </Button>
            <Button
              variant={timeRange === "30days" ? "default" : "outline"}
              size="sm"
              onClick={handlePeriodChange("30days")}
              className={timeRange === "30days" ? "bg-black hover:bg-gray-800" : ""}
            >
              30 ngày
            </Button>
            <Button
              variant={timeRange === "90days" ? "default" : "outline"}
              size="sm"
              onClick={handlePeriodChange("90days")}
              className={timeRange === "90days" ? "bg-black hover:bg-gray-800" : ""}
            >
              90 ngày
            </Button>
            <Button
              variant={timeRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={handlePeriodChange("all")}
              className={timeRange === "all" ? "bg-black hover:bg-gray-800" : ""}
            >
              Tất cả
            </Button>
          </div>
        </div>
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
                {chartLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={0} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => value.toLocaleString("vi-VN")} />
                      <Bar dataKey="views" fill="#000000" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Hiệu suất Video</CardTitle>
                <CardDescription>Hiệu suất của 10 video mới nhất trong khoảng thời gian đã chọn</CardDescription>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                  </div>
                ) : performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={0} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => value.toLocaleString("vi-VN")} />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#ef4444" activeDot={{ r: 8 }} name="Lượt xem" />
                      <Line type="monotone" dataKey="likes" stroke="#3b82f6" name="Lượt thích" />
                      <Line type="monotone" dataKey="comments" stroke="#10b981" name="Bình luận" />
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
                                  <div className="relative w-16 h-9 overflow-hidden rounded flex-shrink-0">
                                    <img
                                      src={video.thumbnail || "/placeholder.svg?height=200&width=350"}
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <a
                                    href={
                                      userInfo
                                        ? `https://www.tiktok.com/@${userInfo.username}/video/${video.id}`
                                        : "#"
                                    }
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
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                        <div className="text-sm text-muted-foreground">
                          Hiển thị {(currentPage - 1) * videosPerPage + 1} đến{" "}
                          {Math.min(currentPage * videosPerPage, filteredVideos.length)} trong{" "}
                          {filteredVideos.length} video
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
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {filteredVideos.length === 0 ? (
              <div className="col-span-full text-center p-8 text-muted-foreground">
                Không có video nào trong khoảng thời gian đã chọn
              </div>
            ) : (
              filteredVideos.map((video) => (
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
                        href={
                          userInfo ? `https://www.tiktok.com/@${userInfo.username}/video/${video.id}` : "#"
                        }
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
                        <Progress
                          value={Math.min(video.engagementRate || 0, 100)}
                          className="h-2 mt-1 bg-gray-200"
                        >
                          <div
                            className="h-full bg-gray-500"
                            style={{ width: `${Math.min(video.engagementRate || 0, 100)}%` }}
                          ></div>
                        </Progress>
                        <p className="text-right text-sm font-medium mt-1">
                          {video.engagementRate?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  )
}

export default TikTokStats;