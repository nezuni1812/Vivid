"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, ChevronDown, Filter, BarChart3, ThumbsUp, Eye, LogOut, RefreshCw } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

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
  const [isSdkLoaded, setSdkLoaded] = useState(false);
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
      setSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v19.0",
      });
      setSdkLoaded(true);
    };

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
    // Filter by time range
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - range.days)

    const filtered =
      range.days === 3650 ? [...videoList] : videoList.filter((video) => new Date(video.created_time) >= cutoffDate)

    // Sort the videos
    filtered.sort((a, b) => {
      let comparison = 0

      if (sort === "date") {
        comparison = new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
      } else if (sort === "views") {
        comparison = a.views - b.views
      } else if (sort === "likes") {
        comparison = a.likes - b.likes
      } else if (sort === "comments") {
        comparison = a.comments - b.comments
      } else if (sort === "shares") {
        comparison = a.shares - b.shares
      }

      return order === "asc" ? comparison : -comparison
    })

    setFilteredVideos(filtered)

    // Calculate statistics
    const total_views = filtered.reduce((sum, video) => sum + video.views, 0)
    const total_likes = filtered.reduce((sum, video) => sum + video.likes, 0)
    const total_comments = filtered.reduce((sum, video) => sum + video.comments, 0)
    const total_shares = filtered.reduce((sum, video) => sum + video.shares, 0)

    setTotalViews(total_views)
    setTotalLikes(total_likes)
    setTotalComments(total_comments)
    setTotalShares(total_shares)

    // Prepare chart data
    prepareChartData(filtered, range.days)
  }

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
      applyFiltersAndSort(videos, timeRange, sortBy, sortOrder)
    }
  }, [timeRange, sortBy, sortOrder])

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-600 flex items-center">
        <BarChart3 className="mr-2" /> Facebook Video Analytics
      </h1>

      {!authState.isLoggedIn ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-semibold mb-6">Welcome to Facebook Video Analytics</h2>
          <p className="mb-8 text-gray-600">
            Connect your Facebook account to view detailed analytics for your Page videos.
          </p>
          <button
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center mx-auto"
          >
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
            Connect with Facebook
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="mr-2 font-medium">Select Page:</label>
                <select
                  className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const page = pages.find((p) => p.id === e.target.value)
                    if (page) setSelectedPage(page)
                  }}
                  value={selectedPage?.id || ""}
                >
                  {pages.length === 0 && <option value="">No pages available</option>}
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mr-2 font-medium flex items-center">
                  <Calendar className="mr-1 h-4 w-4" /> Time Range:
                </label>
                <select
                  className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={timeRange.days.toString()}
                  onChange={(e) => {
                    const range = timeRanges.find((r) => r.days.toString() === e.target.value)
                    if (range) setTimeRange(range)
                  }}
                >
                  {timeRanges.map((range) => (
                    <option key={range.days} value={range.days.toString()}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                title="Change account"
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Change Account
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                title="Logout"
              >
                <LogOut className="mr-1 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-md">
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">Total Views</h3>
                  <p className="text-3xl font-bold text-blue-800">{totalViews.toLocaleString()}</p>
                  <p className="text-sm text-blue-600 mt-2">For {timeRange.label.toLowerCase()}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 shadow-md">
                  <h3 className="text-lg font-semibold text-purple-700 mb-2">Total Likes</h3>
                  <p className="text-3xl font-bold text-purple-800">{totalLikes.toLocaleString()}</p>
                  <p className="text-sm text-purple-600 mt-2">For {timeRange.label.toLowerCase()}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-md">
                  <h3 className="text-lg font-semibold text-green-700 mb-2">Total Comments</h3>
                  <p className="text-3xl font-bold text-green-800">{totalComments.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-2">For {timeRange.label.toLowerCase()}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 shadow-md">
                  <h3 className="text-lg font-semibold text-orange-700 mb-2">Total Shares</h3>
                  <p className="text-3xl font-bold text-orange-800">{totalShares.toLocaleString()}</p>
                  <p className="text-sm text-orange-600 mt-2">For {timeRange.label.toLowerCase()}</p>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Performance Over Time</h2>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        activeMetric === "views"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                      onClick={() => setActiveMetric("views")}
                    >
                      Views
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        activeMetric === "likes"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                      onClick={() => setActiveMetric("likes")}
                    >
                      Likes
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        activeMetric === "comments"
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                      onClick={() => setActiveMetric("comments")}
                    >
                      Comments
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        activeMetric === "shares"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                      onClick={() => setActiveMetric("shares")}
                    >
                      Shares
                    </button>
                  </div>
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
                            name="Views"
                            strokeWidth={2}
                          />
                        )}
                        {activeMetric === "likes" && (
                          <Line
                            type="monotone"
                            dataKey="likes"
                            stroke="#8b5cf6"
                            activeDot={{ r: 8 }}
                            name="Likes"
                            strokeWidth={2}
                          />
                        )}
                        {activeMetric === "comments" && (
                          <Line
                            type="monotone"
                            dataKey="comments"
                            stroke="#22c55e"
                            activeDot={{ r: 8 }}
                            name="Comments"
                            strokeWidth={2}
                          />
                        )}
                        {activeMetric === "shares" && (
                          <Line
                            type="monotone"
                            dataKey="shares"
                            stroke="#f97316"
                            activeDot={{ r: 8 }}
                            name="Shares"
                            strokeWidth={2}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No data available for the selected time period</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Video List */}
              <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div>
                  <label className="mr-2 font-medium flex items-center">
                    <Filter className="mr-1 h-4 w-4" /> Sort By:
                  </label>
                  <select
                    className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="date">Date</option>
                    <option value="views">Views</option>
                    <option value="likes">Likes</option>
                    <option value="comments">Comments</option>
                    <option value="shares">Shares</option>
                  </select>
                </div>

                <div>
                  <label className="mr-2 font-medium flex items-center">
                    <ChevronDown className="mr-1 h-4 w-4" /> Order:
                  </label>
                  <select
                    className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  >
                    <option value="desc">Highest First</option>
                    <option value="asc">Lowest First</option>
                  </select>
                </div>
              </div>

              {filteredVideos.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600">No videos found for this page in the selected time range.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-4 text-gray-800">All Videos ({filteredVideos.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map((video) => (
                      <div
                        key={video.id}
                        className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white"
                      >
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
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>

                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 text-blue-500 mr-1" />
                              <span>{video.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center">
                              <ThumbsUp className="h-4 w-4 text-red-500 mr-1" />
                              <span>{video.likes.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-green-500 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>{video.comments.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-blue-500 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                              </svg>
                              <span>{video.shares.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                              {new Date(video.created_time).toLocaleDateString(undefined, {
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
                              View on Facebook
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default FacebookStatsPage
