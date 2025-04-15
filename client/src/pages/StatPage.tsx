import type React from "react"

import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
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
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"

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

const StatPage = () => {
		const location = useLocation()
		const accessToken = localStorage.getItem("accessToken")
		const [videos, setVideos] = useState<VideoItem[]>([])
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

		const totalViews = videos.reduce((acc, video) => acc + Number.parseInt(video.viewCount), 0)
		const totalComments = videos.reduce((acc, video) => acc + Number.parseInt(video.commentCount), 0)
		const totalLikes = videos.reduce((acc, video) => acc + Number.parseInt(video.likeCount || "0"), 0)

		// Dữ liệu cho biểu đồ cột
		const chartData = videos.map((video) => ({
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
								if (!accessToken) {
										setError("Vui lòng đăng nhập tài khoản Youtube để xem thống kê")
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

								// Lấy playlistId của video uploads
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
										`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}`,
										{
												headers: {
														Authorization: `Bearer ${accessToken}`,
												},
										},
								)
								const statsData = await videoStatsRes.json()

								const videoList: VideoItem[] = statsData.items.map((item: any) => ({
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
		}, [])

		useEffect(() => {
				if (channelInfo) {
						fetchAnalyticsData()
						fetchVideoAnalytics()
				}
		}, [channelInfo, selectedPeriod, customStartDate, customEndDate])

		useEffect(() => {
				setCurrentPage(1)
		}, [selectedPeriod, customStartDate, customEndDate, sortField, sortDirection])

		const fetchAnalyticsData = async () => {
				if (!accessToken || !channelInfo) return

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

						const analyticsRes = await fetch(
								`https://youtubeanalytics.googleapis.com/v2/reports?dimensions=day&metrics=views,estimatedMinutesWatched,subscribersGained&sort=day&startDate=${startDate}&endDate=${endDate}&ids=channel==${channelInfo.id}`,
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
				if (!accessToken || !channelInfo || videos.length === 0) return

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

						const videoIds = videos.map((video) => video.id).join(",")

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

										const videoInfo = videos.find((v) => v.id === videoId)

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

    if (loading) return <div className="p-6 text-center">Loading...</div>
    if (error) return <div className="p-6 text-red-500">{error}</div>

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Video Statistics</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded shadow text-center">
            <p className="text-sm text-gray-500">Tổng video</p>
            <p className="text-xl font-bold">{videos.length}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded shadow text-center">
            <p className="text-sm text-gray-500">Tổng lượt xem</p>
            <p className="text-xl font-bold">{totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded shadow text-center">
            <p className="text-sm text-gray-500">Tổng lượt thích</p>
            <p className="text-xl font-bold">{totalLikes.toLocaleString()}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded shadow text-center">
            <p className="text-sm text-gray-500">Tổng comment</p>
            <p className="text-xl font-bold">{totalComments.toLocaleString()}</p>
          </div>
        </div>

        {/* Video Views Bar Chart */}
        <h2 className="text-xl font-bold mb-3">Lượt xem theo video</h2>
        <div className="mb-8">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Analytics Line Chart */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3">Phân tích kênh theo thời gian gần đây</h2>

          {/* Time Period Selector */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={handlePeriodChange("7")}
              type="button"
              className={`px-3 py-1 rounded ${selectedPeriod === "7" ? "bg-blue-500" : "bg-gray-200"}`}
            >
              7 ngày
            </button>
            <button
              onClick={handlePeriodChange("30")}
              type="button"
              className={`px-3 py-1 rounded ${selectedPeriod === "30" ? "bg-blue-500" : "bg-gray-200"}`}
            >
              30 ngày
            </button>
            <button
              onClick={handlePeriodChange("90")}
              type="button"
              className={`px-3 py-1 rounded ${selectedPeriod === "90" ? "bg-blue-500" : "bg-gray-200"}`}
            >
              90 ngày
            </button>
            <button
              onClick={handlePeriodChange("365")}
              type="button"
              className={`px-3 py-1 rounded ${selectedPeriod === "365" ? "bg-blue-500" : "bg-gray-200"}`}
            >
              365 ngày
            </button>
            <button
              onClick={handlePeriodChange("all")}
              type="button"
              className={`px-3 py-1 rounded ${selectedPeriod === "all" ? "bg-blue-500" : "bg-gray-200"}`}
            >
              Tất cả
            </button>
            <button
              onClick={handlePeriodChange("custom")}
              type="button"
              className={`px-3 py-1 rounded ${selectedPeriod === "custom" ? "bg-blue-500" : "bg-gray-200"}`}
            >
              Tùy chỉnh
            </button>
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === "custom" && (
            <div className="flex gap-4 mb-4">
              <div>
                <label className="block text-sm mb-1">Từ ngày:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    e.preventDefault()
                    setCustomStartDate(e.target.value)
                  }}
                  className="border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Đến ngày:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    e.preventDefault()
                    setCustomEndDate(e.target.value)
                  }}
                  className="border rounded px-2 py-1"
                />
              </div>
            </div>
          )}

          {/* Line Chart */}
          {chartLoading ? (
            <div className="flex justify-center items-center h-[400px] bg-gray-50 rounded">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-2">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : analyticsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="views" stroke="#8884d8" name="Lượt xem" strokeWidth={2} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="subscribers"
                  stroke="#82ca9d"
                  name="Người đăng ký mới"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="watchTimeHours"
                  stroke="#ff7300"
                  name="Giờ xem (h)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center p-4 bg-gray-100 rounded">
              Không có dữ liệu phân tích cho khoảng thời gian đã chọn
            </div>
          )}

          {/* Video Analytics Table */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-3">Chi tiết</h3>

            {tableLoading ? (
              <div className="flex justify-center items-center h-[200px] bg-gray-50 rounded">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="mt-2">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : videoAnalytics.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Video</th>
                        <th className="p-2 text-left cursor-pointer" onClick={() => handleSort("publishedAt")}>
                          <div className="flex items-center">
                            Ngày đăng
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                            {sortField === "publishedAt" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-right cursor-pointer" onClick={() => handleSort("views")}>
                          <div className="flex items-center justify-end">
                            Lượt xem
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                            {sortField === "views" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </th>
                        <th className="p-2 text-right cursor-pointer" onClick={() => handleSort("watchTimeHours")}>
                          <div className="flex items-center justify-end">
                            Giờ xem
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                            {sortField === "watchTimeHours" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-right cursor-pointer" onClick={() => handleSort("subscribers")}>
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
                      {currentVideos.map((video) => (
                        <tr key={video.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center space-x-3">
                              <img
                                src={video.thumbnail || "/placeholder.svg"}
                                alt={video.title}
                                className="w-16 h-9 object-cover rounded"
                              />
                              <a
                                href={`https://www.youtube.com/watch?v=${video.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:underline line-clamp-2"
                              >
                                {video.title}
                              </a>
                            </div>
                          </td>
                          <td className="p-2 text-sm">
                            {new Date(video.publishedAt).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="p-2 text-right">{video.views.toLocaleString()}</td>
                          <td className="p-2 text-right">{video.watchTimeHours.toLocaleString()}</td>
                          <td className="p-2 text-right">{video.subscribers.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Hiển thị {(currentPage - 1) * videosPerPage + 1} đến{" "}
                      {Math.min(currentPage * videosPerPage, videoAnalytics.length)} trong số {videoAnalytics.length}{" "}
                      video
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded flex items-center ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded flex items-center ${
                          currentPage === totalPages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        Sau <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-4 bg-gray-100 rounded">
                Không có dữ liệu phân tích video cho khoảng thời gian đã chọn
              </div>
            )}
          </div>
        </div>

        {/* Video Cards */}
        <h2 className="text-xl font-bold mb-3">Video gần đây</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="border rounded-lg shadow p-4 bg-white hover:shadow-lg transition w-full max-w-[360px] mx-auto"
            >
              <img src={video.thumbnail || "/placeholder.svg"} alt={video.title} className="rounded mb-2 w-full" />
              <h2 className="text-lg font-semibold text-blue-600">
                <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                  {video.title}
                </a>
              </h2>
              <p className="text-sm text-gray-500">Views: {Number.parseInt(video.viewCount).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Comments: {Number.parseInt(video.commentCount).toLocaleString()}</p>
              <p className="text-sm text-gray-400">Published: {new Date(video.publishedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    )
}

export default StatPage
