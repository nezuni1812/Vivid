"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "./ui/button"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  ImageIcon,
  Film,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Move,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface TimelineItem {
  id: string
  type: "image" | "video" | "audio"
  src: string
  duration: number
  start: number
}

export default function VideoEditor() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(60) // 60 seconds total duration
  const [transition, setTransition] = useState("fade")
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([
    {
      id: "1",
      type: "image",
      src: "/placeholder.svg?height=180&width=320",
      duration: 5,
      start: 0,
    },
    {
      id: "2",
      type: "image",
      src: "/placeholder.svg?height=180&width=320",
      duration: 5,
      start: 5,
    },
    {
      id: "3",
      type: "audio",
      src: "audio-file.mp3",
      duration: 15,
      start: 0,
    },
  ])

  const timelineRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const draggedItem = useRef<string | null>(null)

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const clickPosition = e.clientX - rect.left
    const percentage = clickPosition / rect.width
    const newTime = percentage * duration

    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleDragStart = (id: string) => {
    isDragging.current = true
    draggedItem.current = id
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()

    if (!draggedItem.current || draggedItem.current === targetId) {
      isDragging.current = false
      draggedItem.current = null
      return
    }

    const items = [...timelineItems]
    const draggedItemIndex = items.findIndex((item) => item.id === draggedItem.current)
    const targetItemIndex = items.findIndex((item) => item.id === targetId)

    if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
      const [movedItem] = items.splice(draggedItemIndex, 1)
      items.splice(targetItemIndex, 0, movedItem)
      setTimelineItems(items)
    }

    isDragging.current = false
    draggedItem.current = null
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="bg-gray-900 flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-3xl aspect-video bg-black">
          <img
            src="/placeholder.svg?height=720&width=1280"
            alt="Video preview"
            className="w-full h-full object-contain"
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 h-16 w-16"
                onClick={togglePlayPause}
              >
                <Play className="h-8 w-8 text-white" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-100 p-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentTime(0)}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={togglePlayPause}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentTime(duration)}>
              <SkipForward className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Hiệu ứng chuyển cảnh:</span>
            <Select value={transition} onValueChange={setTransition}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn hiệu ứng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Mờ dần</SelectItem>
                <SelectItem value="slide">Trượt</SelectItem>
                <SelectItem value="zoom">Phóng to</SelectItem>
                <SelectItem value="none">Không có</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className="h-2 bg-gray-200 rounded-full mb-4 cursor-pointer relative"
          onClick={handleTimelineClick}
          ref={timelineRef}
        >
          <div
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute top-0 h-4 w-4 bg-white border-2 border-green-500 rounded-full -mt-1 cursor-grab"
            style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
          />
        </div>

        <div className="flex space-x-2 mb-4">
          <Button variant="outline" size="sm">
            <ImageIcon className="h-4 w-4 mr-2" />
            Thêm hình ảnh
          </Button>
          <Button variant="outline" size="sm">
            <Film className="h-4 w-4 mr-2" />
            Thêm video
          </Button>
          <Button variant="outline" size="sm">
            <Music className="h-4 w-4 mr-2" />
            Thêm nhạc nền
          </Button>
        </div>

        <div className="border rounded-md bg-white">
          <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-medium">Timeline</h3>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Thêm mục
            </Button>
          </div>

          <div className="max-h-[200px] overflow-y-auto">
            {timelineItems.map((item) => (
              <div
                key={item.id}
                className="border-b last:border-b-0 p-3 flex items-center justify-between hover:bg-gray-50"
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id)}
              >
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="icon" className="cursor-grab">
                    <Move className="h-4 w-4 text-gray-400" />
                  </Button>

                  {item.type === "image" && (
                    <img
                      src={item.src || "/placeholder.svg"}
                      alt="Timeline item"
                      className="w-16 h-9 object-cover rounded"
                    />
                  )}

                  {item.type === "audio" && (
                    <div className="w-16 h-9 bg-blue-100 rounded flex items-center justify-center">
                      <Music className="h-4 w-4 text-blue-500" />
                    </div>
                  )}

                  <div>
                    <p className="font-medium">
                      {item.type === "image" ? "Hình ảnh" : item.type === "video" ? "Video" : "Âm thanh"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(item.start)} - {formatTime(item.start + item.duration)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
