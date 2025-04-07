export const SceneDisplay = ({
  displayedScenes,
  currentText,
}: {
  displayedScenes: string[];
  currentText: string;
}) => (
  <div className="text-fantasy-text whitespace-pre-line space-y-4">
    {displayedScenes.map((text, i) => (
      <p key={i}>{text}</p>
    ))}
    {currentText && <p>{currentText}</p>}
  </div>
);
