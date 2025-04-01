const FeatureSection = () => {
  return (
    <div className="space-y-4">
      <h1 className="story-list-h2">Features</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2 pb-20 ">
        <div className="story-list-feature-wrapper2 ">
          <p className="font-semibold ">당신의 스토리를 직접 만들어 나가세요</p>
        </div>
        <div className="story-list-feature-wrapper2">
          <p className="font-semibold ">끝나지 않는 이야기, 기록되는 역사</p>
        </div>
        <div className="story-list-feature-wrapper2">
          <p className="font-semibold ">특별한 컬렉션 NFT</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;
