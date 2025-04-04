import { Story } from '../types/story';

export const StoryHeader = ({
  story,
  imageSrc,
}: {
  story: Story;
  imageSrc: string | null;
}) => (
  <div className="space-y-2">
    <h2 className="text-xl font-semibold text-fantasy-text">{story.title}</h2>
    <p className="text-fantasy-text/80">{story.summary}</p>
    {imageSrc && (
      <img
        src={imageSrc}
        alt={story.title}
        className="w-[40%] max-w-3xl rounded-lg border border-[#d2c5ae]"
      />
    )}
  </div>
);
