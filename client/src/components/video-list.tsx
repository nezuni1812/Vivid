import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Edit, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

type VideoStatus = "processing" | "completed" | "failed"

interface Video {
  id: string
  title: string
  thumbnail: string
  status: VideoStatus
  createdAt: string
  views: number
}

const videos: Video[] = [
  {
    id: "1",
    title: "Khám phá vũ trụ: Các hành tinh trong hệ mặt trời",
    thumbnail: "/placeholder.svg?height=80&width=120",
    status: "completed",
    createdAt: "2023-05-15",
    views: 1245,
  },
  {
    id: "2",
    title: "Tế bào: Đơn vị cơ bản của sự sống",
    thumbnail: "/placeholder.svg?height=80&width=120",
    status: "completed",
    createdAt: "2023-05-10",
    views: 987,
  },
  {
    id: "3",
    title: "Vật lý lượng tử cho người mới bắt đầu",
    thumbnail: "/placeholder.svg?height=80&width=120",
    status: "processing",
    createdAt: "2023-05-18",
    views: 0,
  },
  {
    id: "4",
    title: "Hóa học hữu cơ: Các phản ứng cơ bản",
    thumbnail: "/placeholder.svg?height=80&width=120",
    status: "failed",
    createdAt: "2023-05-05",
    views: 0,
  },
]

const getStatusBadge = (status: VideoStatus) => {
  switch (status) {
    case "processing":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Đang xử lý
        </Badge>
      )
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Hoàn thành
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Thất bại
        </Badge>
      )
    default:
      return null
  }
}

export default function VideoList() {
  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div key={video.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
          <div className="flex items-center space-x-4">
            <img
              src={video.thumbnail || "/placeholder.svg"}
              alt={video.title}
              className="w-20 h-14 object-cover rounded"
            />
            <div>
              <h3 className="font-medium">{video.title}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Ngày tạo: {video.createdAt}</span>
                <span>•</span>
                <span>{video.views} lượt xem</span>
              </div>
              <div className="flex mt-1">{getStatusBadge(video.status)}</div>
            </div>
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Xem
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  )
}
