export default function Message({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p className="mt-2 text-red-500 text-sm flex justify-center">{message}</p>
  );
}
