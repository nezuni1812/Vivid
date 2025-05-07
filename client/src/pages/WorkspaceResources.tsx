"use client"

import { Fragment } from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  RefreshCw,
  CheckCircle,
  FileText,
  ImageIcon,
  Video,
  Music,
  ArrowLeft,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { FaFolder } from "react-icons/fa"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"

// Define interfaces
interface Workspace {
  _id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

interface Resource {
  _id: string
  workspace_id: string
  status: "draft" | "processing" | "completed"
  resource_url: string
  resource_type: "image" | "video" | "audio"
  created_at: string
}

const WorkspaceResources = () => {
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsLoading(true)
      try {
        const storedUser = localStorage.getItem("currentUser")
        const userId = storedUser ? JSON.parse(storedUser).user_id : null

        if (!userId) {
          throw new Error("User not authenticated")
        }

        const response = await fetch(`http://localhost:5000/workspaces?user_id=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch workspaces")
        }

        const workspacesData = await response.json()
        console.log("Workspaces response:", workspacesData)

        const mappedWorkspaces = workspacesData
          .map((w: any) => ({
            _id: w._id?.$oid || w.id || w._id,
            name: w.name,
            description: w.description,
            created_at: w.created_at?.$date?.$numberLong || w.created_at,
            updated_at: w.updated_at?.$date?.$numberLong || w.updated_at,
          }))
          .filter((w: Workspace) => w._id)

        setWorkspaces(mappedWorkspaces)
        console.log("Mapped workspaces:", mappedWorkspaces)
      } catch (error) {
        console.error("Error fetching workspaces:", error)
        setError("Failed to load workspaces")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

  // Define fetchAllResources
  const fetchAllResources = async () => {
    if (workspaces.length === 0) return

    setIsLoading(true)
    try {
      const resourcesPromises = workspaces.map(async (workspace) => {
        const response = await fetch(`http://localhost:5000/workspaces/${workspace._id}/resources`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          console.error(`Failed to fetch resources for workspace ${workspace._id}: ${response.status}`)
          return []
        }

        const resourcesData = await response.json()
        console.log(`Resources for workspace ${workspace._id}:`, resourcesData)

        return resourcesData
          .map((r: any) => ({
            _id: r.resource_id || r._id?.$oid || r._id,
            workspace_id: r.workspace_id || r.workspace_id?.$oid,
            status: r.status,
            resource_url: r.resource_url || "",
            resource_type: r.resource_type,
            created_at: r.created_at,
          }))
          .filter((r: Resource) => r._id && r.workspace_id)
      })

      const allResources = (await Promise.all(resourcesPromises)).flat()
      setResources(allResources)
      console.log("Mapped resources:", allResources)
    } catch (error) {
      console.error("Error fetching resources:", error)
      setError("Failed to load resources")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllResources()
  }, [workspaces])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Bản nháp
          </Badge>
        )
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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4 text-blue-500" />
      case "video":
        return <Video className="h-4 w-4 text-purple-500" />
      case "audio":
        return <Music className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const toggleWorkspaceExpansion = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => ({
      ...prev,
      [workspaceId]: !prev[workspaceId],
    }))
  }

  const getWorkspaceResources = (workspaceId: string) => {
    return resources.filter((resource) => resource.workspace_id === workspaceId)
  }

  const countResourcesByStatus = (workspaceId: string) => {
    const workspaceResources = getWorkspaceResources(workspaceId)
    return {
      total: workspaceResources.length,
      completed: workspaceResources.filter((r) => r.status === "completed").length,
      processing: workspaceResources.filter((r) => r.status === "processing").length,
      draft: workspaceResources.filter((r) => r.status === "draft").length,
    }
  }

  const goBack = () => {
    navigate("/homepage")
  }

  if (isLoading && workspaces.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={goBack} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-10 bg-gray-50">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <Button variant="ghost" onClick={goBack} className="mr-2 p-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FaFolder className="text-purple-600" />
                Quản lý tài nguyên Workspace
              </CardTitle>
              <CardDescription>Xem tài nguyên của tất cả các workspace</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">Tổng số workspace: {workspaces.length}</div>
            <Button onClick={fetchAllResources} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Làm mới dữ liệu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspaces and Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Workspace và Tài nguyên</CardTitle>
          <CardDescription>
            Bấm vào nút mở rộng để xem tài nguyên của từng workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FaFolder className="mx-auto text-4xl mb-3 text-gray-400" />
              <h3 className="text-lg font-medium mb-1">Không tìm thấy workspace nào</h3>
              <p className="text-gray-500 mb-4">Hãy tạo workspace đầu tiên để bắt đầu</p>
              <Button onClick={() => navigate("/")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang chủ
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Tên Workspace</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Tài nguyên</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workspaces.map((workspace) => {
                      const resourceCounts = countResourcesByStatus(workspace._id)
                      const isExpanded = expandedWorkspaces[workspace._id] || false

                      return (
                        <Fragment key={workspace._id}>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleWorkspaceExpansion(workspace._id)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FaFolder className="text-purple-600" />
                                {workspace.name}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {workspace.description || "Không có mô tả"}
                            </TableCell>
                            <TableCell>{formatDate(workspace.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-800">
                                  {resourceCounts.total} tài nguyên
                                </Badge>
                                {resourceCounts.completed > 0 && (
                                  <Badge variant="outline" className="bg-green-50 text-green-800">
                                    {resourceCounts.completed} hoàn thành
                                  </Badge>
                                )}
                                {resourceCounts.processing > 0 && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                                    {resourceCounts.processing} đang xử lý
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-auto"
                                  onClick={() => navigate(`/workspace/${workspace._id}`)}
                                >
                                  <ExternalLink className="h-5 w-5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expanded resources table */}
                          {isExpanded && (
                            <TableRow key={`${workspace._id}-resources`}>
                              <TableCell colSpan={5} className="p-0 border-t-0">
                                <div className="bg-gray-50 p-4">
                                  <h3 className="text-sm font-medium mb-2">Tài nguyên của {workspace.name}</h3>
                                  {getWorkspaceResources(workspace._id).length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                      <p className="text-gray-500">Không có tài nguyên nào trong workspace này</p>
                                    </div>
                                  ) : (
                                    <div className="rounded-md border overflow-hidden bg-white">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Loại</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Ngày tạo</TableHead>
                                            <TableHead>URL</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {getWorkspaceResources(workspace._id).map((resource) => (
                                            <TableRow key={resource._id}>
                                              <TableCell>
                                                <div className="flex items-center gap-2">
                                                  {getResourceTypeIcon(resource.resource_type)}
                                                  <span className="capitalize">
                                                    {resource.resource_type === "image"
                                                      ? "Hình ảnh"
                                                      : resource.resource_type === "video"
                                                      ? "Video"
                                                      : "Âm thanh"}
                                                  </span>
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="flex items-center gap-2">
                                                  {getStatusIcon(resource.status)}
                                                  {getStatusBadge(resource.status)}
                                                </div>
                                              </TableCell>
                                              <TableCell>{formatDate(resource.created_at)}</TableCell>
                                              <TableCell className="max-w-xs truncate">
                                                {resource.status === "completed" ? (
                                                  <a
                                                    href={resource.resource_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                                  >
                                                    <span className="truncate">{resource.resource_url}</span>
                                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                                  </a>
                                                ) : (
                                                  <span className="text-gray-500 italic">Chưa có URL</span>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default WorkspaceResources