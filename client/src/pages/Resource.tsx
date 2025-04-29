import { useEffect, useState } from "react";

const Resource = ({ workspace_id }: { workspace_id: string | undefined }) => {
  const [scriptContent, setScriptContent] = useState<string[]>([
    "http://localhost:5000/images/b0c24e0208044db8af2afdf523ff4f6e.png",
    "http://localhost:5000/images/f42cd7200b724ce090ac972ca25bd5bb.png",
    "http://localhost:5000/images/1284c3a6a06b49b3bc828d5424b9636b.png",
    "http://localhost:5000/images/6e1ad82ff5e148f6970b99c48ae55fc0.png",
    "https://videos.pexels.com/video-files/6738901/6738901-uhd_3840_2160_25fps.mp4",
    "https://videos.pexels.com/video-files/8064156/8064156-hd_1920_1080_30fps.mp4",
    "http://localhost:5000/images/de09158baa0a47f3a8ff317f2aeded14.png",
    "https://videos.pexels.com/video-files/4806404/4806404-hd_1080_1920_30fps.mp4",
    "https://videos.pexels.com/video-files/5726648/5726648-uhd_1440_2732_25fps.mp4",
    "https://videos.pexels.com/video-files/7955160/7955160-uhd_4096_2160_25fps.mp4",
    "https://videos.pexels.com/video-files/3129902/3129902-uhd_2560_1440_25fps.mp4",
    "https://videos.pexels.com/video-files/7698685/7698685-uhd_4096_2160_25fps.mp4",
    "https://videos.pexels.com/video-files/25935014/11922020_720_1280_15fps.mp4"
  ]);

  const [prompt, setPrompt] = useState<string[]>(
    Array(scriptContent.length).fill("")
  );
  const [audioData, setAudioData] = useState<any>(null); // State to hold the fetched data
  const [loading, setLoading] = useState<boolean>(true); // State for loading indicator
  const [error, setError] = useState<string | null>(null); // State for error handling

  useEffect(() => {
    const fetchAudioData = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error

        const response = await fetch(`http://localhost:5000/workspaces/${workspace_id}/get?kind=audio`);

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

    fetchAudioData();
  }, [workspace_id]);
  
  // const [] = useState<string[]>()

  const updateImage = async (index: number, prompt: string) => {
    if (scriptContent[index].endsWith("mp4")) {
      console.log("Video file, skipping image generation.");
      return;
    }

    const res = await fetch(
      import.meta.env.VITE_BACKEND_URL + "/creations/edit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          what: "image",
          script: JSON.parse(audioData.timings)[index].content,
          prompt: prompt,
          filename: scriptContent[index].endsWith("mp4")
            ? null
            : scriptContent[index],
        }),
      }
    );

    const data = await res.json();
    const updated = [...scriptContent];
    updated[index] = data.content;
    setScriptContent(updated);
    console.log("Image updated:", data.content);
  };

  if (loading) {
    return <div>Loading...{audioData?.timing}</div>; // Loading state
  }
  if (error) {
    return <div>Error: {error}</div>; // Error state
  }
  
  return (
    <div className="w-full max-w-[90rem] mx-auto">
      {audioData.audio_url}
      <button className="sticky top-8">Generate video</button>

      {JSON.parse(audioData.timings).map((item: { start_time: number; end_time: number; content: string }, index: number) => {
        const material = scriptContent[index];
        const isImage =
          material.endsWith(".png") ||
          material.endsWith(".jpg") ||
          material.endsWith(".jpeg");
        const isVideo = material.endsWith(".mp4") || material.endsWith(".mov");

        return (
          <div className="mb-10" key={index}>
            <div className="script-content rounded my-3">
              <textarea
                disabled={true}
                value={item.content}
                className="w-full border rounded resize-y"
                rows={3}
              />
            </div>
            <div className="material-texbtbox flex flex-row gap-4">
              <div className="w-1/2 flex items-center justify-center">
                {isImage && (
                  <img
                    src={
                      material.startsWith("/")
                        ? `${import.meta.env.VITE_BACKEND_URL}${material}`
                        : material
                    }
                    alt={`Material ${index}`}
                    className="w-auto max-h-[60rem]"
                  />
                )}
                {isVideo && (
                  <video controls className="w-full h-auto max-h-[60rem]">
                    <source src={material} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              <div className="w-1/2">
                <textarea
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
                <button
                  type="button"
                  onClick={async () => {
                    console.log("Updating image with prompt:", prompt[index]);
                    await updateImage(index, prompt[index]);
                  }}
                  className="self-start px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Resource;
