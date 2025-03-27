const FeatureSection = () => {
  return (
    <div className="space-y-4">
      <h1 className="story-list-h1">Features</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
        <div className="story-list-feature-wrapper">
          <p className="font-semibold text-[#3e2d1c]">
            당신의 스토리를 직접 만들어 나가세요
          </p>
        </div>
        <div className="story-list-feature-wrapper">
          <p className="font-semibold text-[#3e2d1c]">
            끝나지 않는 이야기, 기록되는 역사
          </p>
        </div>
        <div className="story-list-feature-wrapper">
          <p className="font-semibold text-[#3e2d1c]">특별한 컬렉션 NFT</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;
