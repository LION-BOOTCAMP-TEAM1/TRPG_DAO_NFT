export default function CyberPunk() {
  return (
    <div className="flex flex-row justify-between items-center border-2 border-gray-300 rounded-2xl shadow-2xl  my-2">
      <div>
        <img src="/classficationmain/cyberpunk.png" />
      </div>
      <div className="text-4xl italic ">
        <p>FISPD</p>
      </div>
      <div className="ml-10">
        <p>
          In the future, AI will rule the world and to survive, you must fight
        </p>
        <p> against AI. Survive until the end.</p>
      </div>
      <button className="px-2 classst cursor-pointer">Look</button>
      <button className="px-2 mr-5 classst cursor-pointer">play</button>
    </div>
  );
}
