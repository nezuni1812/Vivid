import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, PlayCircle, Loader2, FileText } from "lucide-react";
import { FaFolder } from "react-icons/fa";

const Resource = ({ workspace_id }: { workspace_id: string | undefined }) => {
  const navigate = useNavigate();

  const [scriptClips, setScriptClips] = useState<any[]>([]);

  const [prompt, setPrompt] = useState<string[]>(
    Array(scriptClips.length).fill("")
  );
  const [audioData, setAudioData] = useState<any>(null); // State to hold the fetched data
  const [loading, setLoading] = useState<boolean>(true); // State for loading indicator
  const [error, setError] = useState<string | null>(null); // State for error handling

  useEffect(() => {
    const fetchAudioData = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error

        const response = await fetch(
          `http://localhost:5000/workspaces/${workspace_id}/get?kind=audio`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch audio data");
        }

        const data = await response.json();
        setAudioData(data); // Set the fetched data in state
        console.log("Fetched audio data:", data); // Log the fetched data
      } catch (err: any) {
        setError(err.message); // Handle error
      } finally {
        setLoading(false); // Stop loading
      }
    };

    const fetchClips = async () => {
      try {
        const response = await fetch(
          new URL(
            `workspaces/${workspace_id}/resources`,
            import.meta.env.VITE_BACKEND_URL
          ),
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch clips data");
        }

        const data = await response.json();
        console.log("Fetched clips data:", data);
        setScriptClips(data);
      } catch (error) {
        console.error("Error fetching clips data:", error);
      }
    };

    const fetchScriptContent = async () => {
      try {
        const response = await fetch(
          `${new URL(
            "get-audio/" + workspace_id,
            import.meta.env.VITE_BACKEND_URL
          )}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch script content");
        }

        const data = await response.json();
        console.log("Fetched script content:", data);
      } catch (error) {
        console.error("Error fetching script content:", error);
      }
    };

    fetchAudioData();
    fetchScriptContent();
    fetchClips();
  }, [workspace_id]);

  const updateImage = async (index: number, prompt: string) => {
    // if (scriptClips[index].resource_type === "video") {
    //   console.log("Video file, skipping image generation.");
    //   return;
    // }

    const res = await fetch(
      import.meta.env.VITE_BACKEND_URL + "/creations/edit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: scriptClips[index].resource_id,
          what: "image",
          script: JSON.parse(audioData.timings)[index].content,
          prompt: prompt,
          filename: scriptClips[index].resource_type === "video"
            ? null
            : scriptClips[index],
        }),
      }
    );

    const data = await res.json();
    const updated = [...scriptClips];
    updated[index] = data.content;
    setScriptClips(updated);
    console.log("Image updated:", data.content);
  };

  const callToGenerateClips = () => {
    const clipTimings = JSON.parse(audioData?.timings);
    console.log("Creating clips");

    fetch(
      new URL(
        "/creations?workspace_id=" + workspace_id,
        import.meta.env.VITE_BACKEND_URL
      ),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clipTimings),
      }
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
      </div>
    ); // Loading state
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
            <Button onClick={() => navigate("/homepage")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    ); // Error state
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-10 bg-gray-50">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate("/homepage")} className="mr-2 p-1">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FaFolder className="text-purple-600" />
                  Quản lý tài nguyên
                </CardTitle>
                {/* <CardDescription>
                  Xem và chỉnh sửa tài nguyên cho workspace {workspace_id}
                </CardDescription> */}
                <CardDescription>
                  Xem và chỉnh sửa tài nguyên cho video này
                </CardDescription>
              </div>
            </div>
            <Button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                navigate("/editor", {
                  state: {
                    resourceList: scriptClips.map((clip) => clip?.resource_url),
                    timing: JSON.parse(audioData.timings),
                    audioUrl: audioData.audio_url,
                    workspaceId: workspace_id,
                  },
                });
              }}
            >
              <PlayCircle className="h-4 w-4" />
              Generate video
            </Button>
          </div>
        </CardHeader>
      <br />
        <CardContent>
          {audioData.audio_url && (
            <audio controls className="w-full">
              <source src={audioData.audio_url} type="audio/mpeg" />
              Your browser does not support the audio tag.
            </audio>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tài nguyên</CardTitle>
            <CardDescription className="flex items-center justify-between">
            <span>Chỉnh sửa nội dung và tài liệu cho từng đoạn tài nguyên</span>
            <Button
              onClick={callToGenerateClips}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate resource
            </Button>
            </CardDescription>
        </CardHeader>
        <CardContent>
      {JSON.parse(audioData.timings).map(
        (
          item: { start_time: number; end_time: number; content: string },
          index: number
        ) => {
          let material = scriptClips[index]?.resource_url;
          if (scriptClips[index]?.status == "processing") {
            console.log(
              "Processing",
              scriptClips[index]?.resource_url,
              scriptClips[index]?.status
            );
            material =
              "https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif";
          }
          const isImage = scriptClips[index]?.resource_type === "image";
          const isVideo = scriptClips[index]?.resource_type === "video";

          return (
            <Card key={index} className="mb-10">
              <CardContent className="pt-6">
                <div className="script-content rounded my-3">
                  <Textarea
                    disabled={true}
                    value={item.content}
                    className="w-full border rounded resize-y bg-gray-100"
                    rows={3}
                  />
                </div>
                <div className="material-texbtbox flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2 flex items-center justify-center">
                    {scriptClips[index]?.status == "processing" ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
                        <p className="text-gray-500 mt-2">Đang xử lý...</p>
                      </div>
                    ) : isImage ? (
                      <img
                        src={
                          material.startsWith("/")
                            ? `${import.meta.env.VITE_BACKEND_URL}${material}`
                            : material
                        }
                        alt={`Material ${index}`}
                        className="w-auto max-h-[60rem] rounded"
                      />
                    ) : isVideo ? (
                      <video controls className="w-full h-auto max-h-[60rem] rounded">
                        <source src={material} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="text-gray-500 italic">
                        Không có tài liệu hiển thị
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-1/2">
                    <Textarea
                      placeholder="Edit with AI"
                      value={prompt[index]}
                      onChange={(e) => {
                        const updated = [...prompt];
                        updated[index] = e.target.value;
                        setPrompt(updated);
                      }}
                      className="w-full p-2 border rounded resize-y"
                      rows={8}
                    />
                    <Button
                      type="button"
                      onClick={async () => {
                        console.log("Updating image with prompt:", prompt[index]);
                        await updateImage(index, prompt[index]);
                      }}
                      className="self-start px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition mt-4"
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }
      )}
      {JSON.parse(audioData.timings).length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FaFolder className="mx-auto text-4xl mb-3 text-gray-400" />
          <h3 className="text-lg font-medium mb-1">Không tìm thấy tài nguyên</h3>
          <p className="text-gray-500 mb-4">Hãy tạo tài nguyên để bắt đầu</p>
          <Button onClick={() => navigate("/homepage")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang chủ
          </Button>
        </div>
      )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Resource;
