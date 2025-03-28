import Link from 'next/link';

export default function MiddleAge() {
  return (
    <>
      {/* 에버린 간략 설명 */}
      <div className="flex flex-row justify-between items-center border-2 border-gray-300 rounded-2xl shadow-2xl my-2">
        <div>
          <img src="/classficationmain/Everine.png" />
        </div>
        <div className="text-4xl italic ">
          <p>Everine</p>
        </div>
        <div className="">
          <p> Decide your fate whether to help the hero summoned to </p>
          <p>another world and the kingdom or to help the Demon King.</p>
        </div>
        <Link href={'/story'}>
          <button className="px-2 mr-4 classst">Look</button>
        </Link>

        <Link href={'/pages/login'}>
          <button className="px-2 mr-5 classst">play</button>
        </Link>
      </div>

      {/* 신라 간략 설명 */}
      <div className="flex flex-row justify-between items-center border-2 border-gray-300 rounded-2xl shadow-2xl my-2 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.3)]">
        <div>
          <img src="/classficationmain/silla.png" />
        </div>
        <div className="text-4xl italic ml-2">
          <p>Silla</p>
        </div>
        <div className="ml-10">
          <p>You are Hwarang in a small Silla kingdom in the East.</p>
          <p> Repel the invasion of barbarians and decide your fate.</p>
        </div>
        <button className="px-2 cursor-pointer hover:bg-sky-100  rounded-xl border ">
          Look
        </button>
        <button className="px-2 mr-5 cursor-pointer hover:bg-sky-100  rounded-xl border ">
          play
        </button>
      </div>

      {/* 카이로 간략 설명 */}
      <div className="flex flex-row justify-between items-center border-2 border-gray-300 rounded-2xl shadow-2xl  my-2 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.3)]">
        <div>
          <img src="/classficationmain/cairo.png" />
        </div>
        <div className="text-4xl italic ">
          <p>Cairo</p>
        </div>
        <div className="ml-10">
          <p>In Cairo, Egypt, you are an ordinary citizen. However,</p>
          <p>with the protection of the sun god Ra,</p>
          <p>you can become a pharaoh.</p>
          <p>Decide whether you will become a pharaoh or forge</p>
          <p> a different destiny.</p>
        </div>
        <button className="px-2  classst ">Look</button>
        <button className="px-2 mr-5 classst">play</button>
      </div>
    </>
  );
}
