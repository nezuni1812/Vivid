import { useState } from "react";

const Resource = () => {
  const [script, setScript] = useState<
    { start_time: number; end_time: number; content: string }[]
  >([
    {
      start_time: 0.0,
      end_time: 8.38,
      content:
        "Vật lý lượng tử, một lĩnh vực phức tạp và hấp dẫn, mô tả hành vi của vật chất và năng lượng ở cấp độ nguyên tử và hạ nguyên tử.",
    },
    {
      start_time: 8.38,
      end_time: 17.19,
      content:
        "Khác với vật lý cổ điển, vốn mô tả thế giới vĩ mô một cách chính xác, vật lý lượng tử tiết lộ một thực tế kỳ lạ và phản trực giác.",
    },
    {
      start_time: 17.19,
      end_time: 27.77,
      content:
        "Bản chất sóng hạt là một khái niệm then chốt, chỉ ra rằng các hạt, như electron, có thể biểu hiện đặc tính của cả sóng và hạt tùy thuộc vào cách chúng được quan sát.",
    },
    {
      start_time: 27.77,
      end_time: 39.55,
      content:
        "Điều này có nghĩa là một electron không có một vị trí xác định cho đến khi được đo lường; thay vào đó, nó tồn tại ở dạng chồng chất, một sự kết hợp của tất cả các vị trí có thể.",
    },
    {
      start_time: 39.55,
      end_time: 42.45,
      content: "Một khái niệm quan trọng khác là lượng tử hóa.",
    },
    {
      start_time: 42.45,
      end_time: 48.88,
      content:
        "Năng lượng không được phát ra hoặc hấp thụ một cách liên tục, mà theo các gói rời rạc gọi là lượng tử.",
    },
    {
      start_time: 48.88,
      end_time: 56.35,
      content:
        "Hãy tưởng tượng một chiếc thang thay vì một con dốc; bạn chỉ có thể đứng trên một bậc thang cụ thể, không phải ở giữa hai bậc.",
    },
    {
      start_time: 56.35,
      end_time: 68.39,
      content:
        "Điều này giải thích nhiều hiện tượng, chẳng hạn như quang phổ phát xạ của các nguyên tố, nơi các electron chỉ có thể chuyển đổi giữa các mức năng lượng nhất định, phát ra ánh sáng ở các bước sóng cụ thể.",
    },
    {
      start_time: 68.39,
      end_time: 82.36,
      content:
        "Nguyên lý bất định Heisenberg, một trụ cột khác của vật lý lượng tử, khẳng định rằng có một giới hạn cơ bản đối với độ chính xác mà một số cặp thuộc tính vật lý, như vị trí và động lượng của một hạt, có thể được biết đồng thời.",
    },
    {
      start_time: 82.36,
      end_time: 87.88,
      content:
        "Càng biết chính xác vị trí của một hạt, càng ít biết về động lượng của nó và ngược lại.",
    },
    {
      start_time: 87.88,
      end_time: 93.62,
      content:
        "Điều này không phải do giới hạn của công nghệ đo lường, mà là một thuộc tính vốn có của vũ trụ.",
    },
    {
      start_time: 93.62,
      end_time: 99.24,
      content:
        "Tóm lại, vật lý lượng tử cung cấp một khung lý thuyết mạnh mẽ để hiểu thế giới vi mô.",
    },
    {
      start_time: 99.24,
      end_time: 118.05,
      content:
        "Mặc dù các khái niệm của nó có thể khó nắm bắt, chúng đã dẫn đến những tiến bộ công nghệ mang tính cách mạng, từ laser và bóng bán dẫn đến hình ảnh cộng hưởng từ (MRI) và điện toán lượng tử đang nổi lên, chứng minh tầm quan trọng không thể chối cãi của nó trong khoa học và công nghệ hiện đại.",
    },
  ]);
  const [scriptContent, setScriptContent] = useState<string[]>([
    "http://localhost:5000/images/c5c18475a432489ba61dc6d8c0f0a037.png",
    "http://localhost:5000/images/b388e30ea40445edadece16e0ef846a7.png",
    "http://localhost:5000/images/07d3290668134cc2a21d55dbaa9f76b7.png",
    "http://localhost:5000/images/d5d87d9faf2a421f918cabc1840f23bc.png",
    "http://localhost:5000/images/7e21dd47f3b848e49e050d5fb46ce76c.png",
    "http://localhost:5000/images/ceb5f4361e8b4e73afb9c212ed9c5641.png",
    "http://localhost:5000/images/aaad8326507d48d38a6ff8c6e4a91f5a.png",
    "http://localhost:5000/images/6c9628e75857426aa86ef1e07a79cebe.png",
    "http://localhost:5000/images/251063a3c90c48b2bbec885ce6c23d22.png",
    "http://localhost:5000/images/41a11894f4a24d5b9078a5b56fbe9e63.png",
    "http://localhost:5000/images/43d4b6c6c6a542028ca89a8a7f6cb50b.png",
    "http://localhost:5000/images/394856c418ec4ec58e1e15fb460ecbf9.png",
    "https://videos.pexels.com/video-files/25935014/11922020_720_1280_15fps.mp4",
  ]);
  
  const [prompt, setPrompt] = useState<string[]>(Array(scriptContent.length).fill(""));

  const updateImage = async (
    index: number,
    prompt: string,
  ) => {
    if (scriptContent[index].endsWith("mp4")){
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
          script: script[index].content,
          prompt: prompt,
          filename: scriptContent[index].endsWith("mp4") ? null: scriptContent[index],
        }),
      }
    );
    
    const data = await res.json();
    const updated = [...scriptContent];
    updated[index] = data.content;
    setScriptContent(updated);
    console.log("Image updated:", data.content);
  };

  return (
    <div className="w-full max-w-[90rem] mx-auto">
      <button className="sticky top-8">Generate video</button>

      {script.map((item, index) => {
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
                value={item.content}
                onChange={(e) => {
                  const updated = [...script];
                  updated[index] = {
                    ...updated[index],
                    content: e.target.value,
                  };
                  setScript(updated);
                }}
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
                    const updated = [...script];
                    setScript(updated);
                    console.log("Script updated:", updated);
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
