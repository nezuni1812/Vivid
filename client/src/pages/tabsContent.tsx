const AllContent = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Tất cả video</h2>
        
      </div>
    )
  }
  
  const CreatedContent = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Video đã tạo</h2>
       
      </div>
    )
  }
  
  const ProcessingContent = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Video đang xử lý</h2>
       
      </div>
    )
  }
  
  const StatsContent = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Thống kê</h2>
        <p className="mb-4">Số lượng video đã tạo: 10</p>
      </div>
    )
  }
  
  export { AllContent, CreatedContent, ProcessingContent, StatsContent }
  