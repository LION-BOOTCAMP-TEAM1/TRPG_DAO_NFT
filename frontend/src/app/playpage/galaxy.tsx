export default function Galaxy() {
  return (
    <div className="flex flex-row justify-between items-center border-2 border-gray-300 rounded-2xl shadow-2xl  my-2">
      <div>
        <img src="/classficationmain/galaxy.png" />
      </div>
      <div className="text-4xl italic ">
        <p>Destroy</p>
      </div>
      <div className="ml-10">
        <p>A space war has broken out due to an alien invasion. Survive.</p>
      </div>
      <button className="px-2 classst cursor-pointer">Look</button>
      <button className="px-2 mr-5 classst cursor-pointer">play</button>
    </div>
  );
}
