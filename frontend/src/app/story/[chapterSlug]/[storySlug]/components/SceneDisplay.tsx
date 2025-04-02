export const SceneDisplay = ({
  displayedScenes,
  currentText,
}: {
  displayedScenes: string[];
  currentText: string;
}) => (
  <div className="text-[#3e2d1c] whitespace-pre-line space-y-4">
    {displayedScenes.map((text, i) => (
      <p key={i}>{text}</p>
    ))}
    {currentText && <p>{currentText}</p>}
  </div>
);
