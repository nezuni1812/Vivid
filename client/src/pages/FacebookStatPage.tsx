"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, Filter, ThumbsUp, Eye, LogOut, RefreshCw, AlertCircle, MessageCircle, Share2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Skeleton } from "../components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface FacebookPage {
  id: string
  name: string
  access_token: string
}

interface VideoInsight {
  id: string
  title: string
  description: string
  views: number
  likes: number
  comments: number
  shares: number
  created_time: string
  thumbnail_url: string
  permalink_url: string
  duration: number
  daily_data?: { date: string; views: number; likes: number; comments: number; shares: number }[]
}

interface TimeRange {
  label: string
  days: number
}

interface UserAuth {
  isLoggedIn: boolean
  pages: FacebookPage[]
  selectedPageId?: string
}

declare const FB: any

const LOCAL_STORAGE_KEY = "facebook_stats_auth"

const FacebookStatsPage = () => {
  // Auth state
  const [authState, setAuthState] = useState<UserAuth>({
    isLoggedIn: false,
    pages: [],
  })

  const [pages, setPages] = useState<FacebookPage[]>([])
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null)
  const [videos, setVideos] = useState<VideoInsight[]>([])
  const [filteredVideos, setFilteredVideos] = useState<VideoInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "views" | "likes" | "comments" | "shares">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [timeRange, setTimeRange] = useState<TimeRange>({ label: "Last 30 days", days: 30 })
  const [totalViews, setTotalViews] = useState(0)
  const [totalLikes, setTotalLikes] = useState(0)
  const [totalComments, setTotalComments] = useState(0)
  const [totalShares, setTotalShares] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])
  const [activeMetric, setActiveMetric] = useState<"views" | "likes" | "comments" | "shares">("views")
  const [isSdkLoaded, setSdkLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const timeRanges: TimeRange[] = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "All time", days: 3650 },
  ]

  // Load auth state from localStorage on initial render
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

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, [])

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (!isSdkLoaded) return;
    if (authState.isLoggedIn) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          ...authState,
          selectedPageId: selectedPage?.id,
        }),
      )
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }, [authState, selectedPage])

  useEffect(() => {
    if (!isSdkLoaded) return;
  
    const savedAuth = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedAuth) {
      const parsedAuth = JSON.parse(savedAuth)
      setAuthState({
        isLoggedIn: true,
        pages: parsedAuth.pages,
        selectedPageId: parsedAuth.selectedPageId,
      })
  
      const selected = parsedAuth.pages.find((p: FacebookPage) => p.id === parsedAuth.selectedPageId)
      if (selected) {
        setPages(parsedAuth.pages)
        setSelectedPage(selected)
      }
    }
  }, [isSdkLoaded])

  const handleLogin = () => {
    if (!isSdkLoaded) return;
    if (typeof FB === "undefined") {
      alert("Facebook SDK not loaded. Please refresh the page.")
      return
    }

    FB.login(
      (response: any) => {
        if (response.authResponse) {
          fetchPages()
        } else {
          alert("Facebook login failed. Please try again.")
        }
      },
      {
        scope: "pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_posts,publish_video,read_insights",
        auth_type: "rerequest",
      },
    )
  }

  const handleLogout = () => {
    if (typeof FB !== "undefined") {
      FB.logout(() => {
        setAuthState({
          isLoggedIn: false,
          pages: [],
        })
        setPages([])
        setSelectedPage(null)
        setVideos([])
        setFilteredVideos([])
      })
    } else {
      // If FB SDK is not available, just clear the state
      setAuthState({
        isLoggedIn: false,
        pages: [],
      })
      setPages([])
      setSelectedPage(null)
      setVideos([])
      setFilteredVideos([])
    }
  }

  const fetchPages = () => {
    setLoading(true)
    FB.api("/me/accounts", "GET", {}, (res: any) => {
      setLoading(false)
      if (res && res.data && res.data.length > 0) {
        const pageList = res.data.map((page: any) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
        }))

        setPages(pageList)
        setSelectedPage(pageList[0])

        setAuthState({
          isLoggedIn: true,
          pages: pageList,
          selectedPageId: pageList[0].id,
        })
      } else {
        alert("No Facebook Pages found. You need to be an admin of at least one Facebook Page.")
        console.error("Failed to fetch pages or no pages available:", res)
      }
    })
  }

  const fetchVideoStats = async (page: FacebookPage) => {
    setLoading(true)
    try {
      // First, get the list of videos with a higher limit
      const videoListPromise = new Promise<any[]>((resolve) => {
        FB.api(
          `/${page.id}/videos`,
          "GET",
          {
            access_token: page.access_token,
            limit: 50, // Increased limit
            fields:
              "id,title,description,created_time,permalink_url,length,source,picture,thumbnails{uri,width,height}",
          },
          (videoRes: any) => {
            if (!videoRes || !videoRes.data) {
              console.error("Failed to fetch videos:", videoRes)
              resolve([])
              return
            }
            console.log("Raw video list response:", videoRes)
            resolve(videoRes.data)
          },
        )
      })

      const videoList = await videoListPromise
      console.log("Processed video list:", videoList)

      if (videoList.length === 0) {
        setVideos([])
        setFilteredVideos([])
        setLoading(false)
        return
      }

      // Then get detailed information for each video
      const videoDetailsPromises = videoList.map(
        (video: any) =>
          new Promise<VideoInsight>((resolve) => {
            // Get the video insights with different metrics
            FB.api(
              `/${video.id}`,
              "GET",
              {
                access_token: page.access_token,
                fields:
                  "title,description,created_time,permalink_url,length,picture,thumbnails,video_insights{name,period,values},comments.limit(0).summary(true),likes.limit(0).summary(true)",
              },
              (details: any) => {
                console.log(`Raw video ${video.id} details:`, details)

                // Extract insights data
                let views = 0
                let likes = 0
                let comments = 0
                let shares = 0
                const dailyData: { date: string; views: number; likes: number; comments: number; shares: number }[] = []

                // Get views from video_insights
                if (details.video_insights && details.video_insights.data) {
                  const totalViewsData = details.video_insights.data.find(
                    (insight: any) => insight.name === "total_video_views",
                  )

                  if (totalViewsData && totalViewsData.values && totalViewsData.values.length > 0) {
                    views = totalViewsData.values[0].value || 0
                  }

                  // Try to get daily views data
                  const dailyViewsData = details.video_insights.data.find(
                    (insight: any) => insight.name === "daily_video_views",
                  )

                  if (
                    dailyViewsData &&
                    dailyViewsData.values &&
                    dailyViewsData.values.length > 0 &&
                    dailyViewsData.values[0].value
                  ) {
                    const dailyViews = dailyViewsData.values[0].value

                    // Convert to array of objects with dates
                    Object.entries(dailyViews).forEach(([date, value]) => {
                      dailyData.push({
                        date,
                        views: value as number,
                        likes: 0,
                        comments: 0,
                        shares: 0,
                      })
                    })
                  }
                }

                // Get likes from the likes summary
                if (details.likes && details.likes.summary) {
                  console.log("Likes summary:", details.likes.summary)
                  likes = details.likes.summary.total_count || 0
                }

                // Get comments from the comments summary
                if (details.comments && details.comments.summary) {
                  comments = details.comments.summary.total_count || 0
                }

                // Get shares
                if (details.shares) {
                  shares = details.shares.count || 0
                }

                // Get thumbnail URL - try different approaches
                let thumbnailUrl = ""

                // Try to get from thumbnails field
                if (details.thumbnails && details.thumbnails.data && details.thumbnails.data.length > 0) {
                  // Sort by width to get the largest thumbnail
                  const sortedThumbnails = [...details.thumbnails.data].sort((a: any, b: any) => b.width - a.width)
                  thumbnailUrl = sortedThumbnails[0].uri || ""
                }

                // If no thumbnail, try picture field
                if (!thumbnailUrl && video.picture) {
                  console.log("Using picture field for thumbnail:", video.picture)
                  thumbnailUrl = video.picture
                }

                if (!thumbnailUrl && video.source) {
                  console.log("Using source field for thumbnail:", video.source)
                  thumbnailUrl = video.source
                }

                resolve({
                  id: video.id,
                  title: details.title || video.title || "Untitled Video",
                  description: details.description || video.description || "",
                  views,
                  likes,
                  comments,
                  shares,
                  created_time: details.created_time || video.created_time || new Date().toISOString(),
                  thumbnail_url: thumbnailUrl,
                  permalink_url: `https://facebook.com/${video.id}`,
                  duration: details.length || video.length || 0,
                  daily_data: dailyData,
                })
              },
            )
          }),
      )

      const videoDetails = await Promise.all(videoDetailsPromises)
      console.log("Final processed video details:", videoDetails)

      // Set the videos
      setVideos(videoDetails)

      // Apply initial filtering and sorting
      applyFiltersAndSort(videoDetails, timeRange, sortBy, sortOrder)
    } catch (error) {
      console.error("Error fetching video stats:", error)
      alert("Error fetching video statistics. Please check the console for details.")
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = (
    videoList: VideoInsight[],
    range: TimeRange,
    sort: "date" | "views" | "likes" | "comments" | "shares",
    order: "asc" | "desc",
  ) => {
    // Filter by time range for displayed videos (filteredVideos)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);
  
    const filtered =
      range.days === 3650
        ? [...videoList]
        : videoList.filter((video) => new Date(video.created_time) >= cutoffDate);
  
    // Sort the filtered videos
    filtered.sort((a, b) => {
      let comparison = 0;
  
      if (sort === "date") {
        comparison = new Date(a.created_time).getTime() - new Date(b.created_time).getTime();
      } else if (sort === "views") {
        comparison = a.views - b.views;
      } else if (sort === "likes") {
        comparison = a.likes - b.likes;
      } else if (sort === "comments") {
        comparison = a.comments - b.comments;
      } else if (sort === "shares") {
        comparison = a.shares - b.shares;
      }
  
      return order === "asc" ? comparison : -comparison;
    });
  
    setFilteredVideos(filtered);
  
    // Calculate total statistics from ALL videos (not filtered by time range)
    const total_views = videoList.reduce((sum, video) => sum + video.views, 0);
    const total_likes = videoList.reduce((sum, video) => sum + video.likes, 0);
    const total_comments = videoList.reduce((sum, video) => sum + video.comments, 0);
    const total_shares = videoList.reduce((sum, video) => sum + video.shares, 0);
  
    setTotalViews(total_views);
    setTotalLikes(total_likes);
    setTotalComments(total_comments);
    setTotalShares(total_shares);
  
    // Prepare chart data based on filtered videos (still respects time range)
    prepareChartData(filtered, range.days);
  };

  const prepareChartData = (videos: VideoInsight[], days: number) => {
    // Create a date range for the chart
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Create empty data points for each day in the range
    const dateMap: Record<string, { date: string; views: number; likes: number; comments: number; shares: number }> = {}

    // Initialize with zeros for each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      dateMap[dateStr] = {
        date: dateStr,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      }
    }

    // Aggregate data from all videos
    videos.forEach((video) => {
      // For now, we'll just use the creation date to add the total counts
      const creationDate = new Date(video.created_time).toISOString().split("T")[0]

      if (dateMap[creationDate]) {
        dateMap[creationDate].views += video.views
        dateMap[creationDate].likes += video.likes
        dateMap[creationDate].comments += video.comments
        dateMap[creationDate].shares += video.shares
      }
    })

    // Convert to array and sort by date
    const chartData = Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    setChartData(chartData)
  }

  useEffect(() => {
    if (selectedPage) {
      fetchVideoStats(selectedPage)
    }
  }, [selectedPage])

  useEffect(() => {
    if (videos.length > 0) {
      applyFiltersAndSort(videos, timeRange, sortBy, sortOrder);
    }
  }, [timeRange, sortBy, sortOrder]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "00:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading)
    return (
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Thống kê Video Facebook</h1>
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

  return (
    <div className="mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Thống kê Video Facebook</h1>

        {authState.isLoggedIn && (
          <div className="flex font-semibold flex-wrap gap-2">
            <Select
              onValueChange={(value) => {
                const page = pages.find((p) => p.id === value);
                if (page) setSelectedPage(page);
              }}
              value={selectedPage?.id || ""}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Không có trang nào" />
              </SelectTrigger>
              <SelectContent>
                {pages.length === 0 ? (
                  <SelectItem value="" disabled>
                    Không có trang nào
                  </SelectItem>
                ) : (
                  pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => selectedPage && fetchVideoStats(selectedPage)}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!authState.isLoggedIn ? (
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Chào mừng đến với Thống kê Video Facebook</CardTitle>
            <CardDescription>
              Kết nối tài khoản Facebook của bạn để xem phân tích chi tiết cho video trên Trang của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 flex items-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                className="mr-2"
              >
                <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
              </svg>
              Kết nối với Facebook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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
                    <ThumbsUp className="h-5 w-5 text-pink-500" />
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

            <Card className="bg-orange-50 border-orange-100">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng Chia Sẻ</p>
                    <p className="text-2xl font-bold">{totalShares.toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Share2 className="h-5 w-5 text-orange-500" />
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
                  variant={timeRange.days === 7 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange({ label: "Last 7 days", days: 7 })}
                  className={timeRange.days === 7 ? "bg-blue-500 hover:bg-blue-600" : ""}
                >
                  7 ngày
                </Button>
                <Button
                  variant={timeRange.days === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange({ label: "Last 30 days", days: 30 })}
                  className={timeRange.days === 30 ? "bg-blue-500 hover:bg-blue-600" : ""}
                >
                  30 ngày
                </Button>
                <Button
                  variant={timeRange.days === 90 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange({ label: "Last 90 days", days: 90 })}
                  className={timeRange.days === 90 ? "bg-blue-500 hover:bg-blue-600" : ""}
                >
                  90 ngày
                </Button>
                <Button
                  variant={timeRange.days === 3650 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange({ label: "All time", days: 3650 })}
                  className={timeRange.days === 3650 ? "bg-blue-500 hover:bg-blue-600" : ""}
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
              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Hiệu suất theo thời gian</CardTitle>
                  <CardDescription>Xem xu hướng hiệu suất video của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={activeMetric === "views" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveMetric("views")}
                      className={activeMetric === "views" ? "bg-blue-500 hover:bg-blue-600" : ""}
                    >
                      Lượt xem
                    </Button>
                    <Button
                      variant={activeMetric === "likes" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveMetric("likes")}
                      className={activeMetric === "likes" ? "bg-pink-500 hover:bg-pink-600" : ""}
                    >
                      Lượt thích
                    </Button>
                    <Button
                      variant={activeMetric === "comments" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveMetric("comments")}
                      className={activeMetric === "comments" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      Bình luận
                    </Button>
                    <Button
                      variant={activeMetric === "shares" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveMetric("shares")}
                      className={activeMetric === "shares" ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      Chia sẻ
                    </Button>
                  </div>

                  <div className="h-80">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(date) => {
                              const d = new Date(date)
                              return `${d.getMonth() + 1}/${d.getDate()}`
                            }}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              Number(value).toLocaleString(),
                              activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1),
                            ]}
                            labelFormatter={(label) => formatDate(label)}
                          />
                          <Legend />
                          {activeMetric === "views" && (
                            <Line
                              type="monotone"
                              dataKey="views"
                              stroke="#3b82f6"
                              activeDot={{ r: 8 }}
                              name="Lượt xem"
                              strokeWidth={2}
                            />
                          )}
                          {activeMetric === "likes" && (
                            <Line
                              type="monotone"
                              dataKey="likes"
                              stroke="#ec4899"
                              activeDot={{ r: 8 }}
                              name="Lượt thích"
                              strokeWidth={2}
                            />
                          )}
                          {activeMetric === "comments" && (
                            <Line
                              type="monotone"
                              dataKey="comments"
                              stroke="#22c55e"
                              activeDot={{ r: 8 }}
                              name="Bình luận"
                              strokeWidth={2}
                            />
                          )}
                          {activeMetric === "shares" && (
                            <Line
                              type="monotone"
                              dataKey="shares"
                              stroke="#f97316"
                              activeDot={{ r: 8 }}
                              name="Chia sẻ"
                              strokeWidth={2}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Không có dữ liệu cho khoảng thời gian đã chọn</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="table">
              {/* Video List */}
              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết Video</CardTitle>
                  <CardDescription>Nhấp vào tiêu đề cột để sắp xếp</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 flex flex-wrap gap-4 items-center">
                    <div>
                      <label className="mr-2 font-medium flex items-center">
                        <Filter className="mr-1 h-4 w-4" /> Sắp xếp theo:
                      </label>
                      <select
                        className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                      >
                        <option value="date">Ngày đăng</option>
                        <option value="views">Lượt xem</option>
                        <option value="likes">Lượt thích</option>
                        <option value="comments">Bình luận</option>
                        <option value="shares">Chia sẻ</option>
                      </select>
                    </div>

                    <div>
                      <label className="mr-2 font-medium flex items-center">
                        <ChevronDown className="mr-1 h-4 w-4" /> Thứ tự:
                      </label>
                      <select
                        className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                      >
                        <option value="desc">Cao nhất trước</option>
                        <option value="asc">Thấp nhất trước</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="p-3 text-left">Video</th>
                          <th className="p-3 text-left">Ngày đăng</th>
                          <th className="p-3 text-right">Lượt xem</th>
                          <th className="p-3 text-right">Lượt thích</th>
                          <th className="p-3 text-right">Bình luận</th>
                          <th className="p-3 text-right">Chia sẻ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVideos.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-muted-foreground">
                              Không có dữ liệu video nào trong khoảng thời gian đã chọn
                            </td>
                          </tr>
                        ) : (
                          filteredVideos.map((video) => (
                            <tr key={video.id} className="border-b hover:bg-muted/30">
                              <td className="p-3">
                                <div className="flex items-center space-x-3">
                                  <div className="relative w-16 h-9 overflow-hidden rounded">
                                    {video.thumbnail_url ? (
                                      <img
                                        src={video.thumbnail_url || "/placeholder.svg"}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-xs text-gray-500">No thumbnail</span>
                                      </div>
                                    )}
                                  </div>
                                  <a
                                    href={video.permalink_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary hover:underline line-clamp-2"
                                  >
                                    {video.title}
                                  </a>
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                {new Date(video.created_time).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              <td className="p-3 text-right">{video.views.toLocaleString("vi-VN")}</td>
                              <td className="p-3 text-right">{video.likes.toLocaleString("vi-VN")}</td>
                              <td className="p-3 text-right">{video.comments.toLocaleString("vi-VN")}</td>
                              <td className="p-3 text-right">{video.shares.toLocaleString("vi-VN")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cards">
              {/* Video Cards */}
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {filteredVideos.length === 0 ? (
                  <div className="col-span-full text-center p-8 text-muted-foreground">
                    Không có video nào trong khoảng thời gian đã chọn
                  </div>
                ) : (
                  filteredVideos.map((video) => (
                    <Card key={video.id} className="overflow-hidden hover:shadow-md transition">
                      <div className="h-48 bg-gray-100 relative">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url || "/placeholder.svg"}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">No thumbnail</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="secondary" className="bg-black/70 text-white">
                            {formatDuration(video.duration)}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{video.description}</p>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 text-blue-500 mr-1" />
                            <span>{video.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 text-pink-500 mr-1" />
                            <span>{video.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span>{video.comments.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Share2 className="h-4 w-4 text-orange-500 mr-1" />
                            <span>{video.shares.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            {new Date(video.created_time).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <a
                            href={video.permalink_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Xem trên Facebook
                          </a>
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

export default FacebookStatsPage
