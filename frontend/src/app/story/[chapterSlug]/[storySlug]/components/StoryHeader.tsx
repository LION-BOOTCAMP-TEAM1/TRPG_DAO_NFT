import { Story } from '../types/story';

export const StoryHeader = ({
  story,
  imageSrc,
}: {
  story: Story;
  imageSrc: string | null;
}) => (
  <div className="space-y-2">
    <h2 className="text-xl font-semibold text-[#3e2d1c]">{story.title}</h2>
    <p className="text-[#5e4b3c]">{story.summary}</p>
    {imageSrc && (
      <img
        src={imageSrc}
        alt={story.title}
        className="w-[40%] max-w-3xl rounded-lg border border-[#d2c5ae]"
      />
    )}
  </div>
);
