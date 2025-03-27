import Link from 'next/link';

export default function ProloguePage() {
  return (
    <div className="flex  justify-center ">
      <div className="flex z-10 absolute py-10">
        <h1
          style={{ fontFamily: 'continuous' }}
          className=" text-7xl  drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)] "
        >
          Prologue
        </h1>
      </div>
      <img
        src="/background.png"
        className="w-screen h-screen object-cover overflow-hidden z-0"
      />
      <div className="flex absolute justify-center py-25 ">
        <img
          src="/prologue-removebg-preview.png"
          className="w-[724px] h-[512px]"
        />
      </div>
      <div className="flex z-10 absolute justify-center mt-[610px] px-10 text-3xl">
        <p style={{ fontFamily: 'continuous' }}>
          Brave. You have been chosen by a goddess. Do you want to enter Another
          world, carve out your destiny, and become a legendary hero? Or, will
          you uncover the dark truth of this world and unlock the secrets behind
          it? Right now, what lies ahead of you is a path of endless adventures
          and challenges. A huge castle you see in the distance, ancient ruins
          in a hidden forest, and a bloody smoke of battlefields. The fate of
          this world will vary depending on your choice. So, now be determined
          to be a warrior. Keep in mind that you can be the savior or destroyer
          of this world by holding a sword, learning magic, meeting your
          companions. It is all in your hands. The first moment of choice is
          approaching. Which path would you choose?
          {/*용사여. 당신은 여신의 선택을
          받았습니다. 이세계에 들어가 당신의 운명을 개척하고, 전설 속 영웅이
          되기를 원하는가? 아니면, 이 세계의 어두운 진실을 밝혀내어 그 이면에
          숨겨진 비밀들을 풀어낼 것인가? 지금, 당신의 앞에 펼쳐진 것은 끝없는
          모험과 도전의 길. 저 멀리 보이는 거대한 성, 숨겨진 숲 속의 고대 유적,
          그리고 피비린내 나는 전장의 연기. 당신의 선택에 따라 이 세계의 운명은
          달라질 것입니다. 그러니, 이제 용사의 각오를 다져라. 검을 쥐고, 마법을
          배우고, 동료들을 만나며 이 세계의 구원자 혹은 파괴자가 될 수 있음을
          명심하라. 이 모든 것은 당신의 손에 달려 있습니다. 첫 번째 선택의
          순간이 다가옵니다. 당신은 어느 길을 선택할 것인가? */}
        </p>
      </div>
      <div className="flex absolute bottom-25 justify-items-center ">
        <Link href="/choiceone">
          <button
            style={{ fontFamily: 'continuous' }}
            className="cursor-pointer flex items-center justify-center"
          >
            <img src="/choicebutton.png" alt="choice" />
            <p className="text-3xl hover:text-white mt-1 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)] pr-30">
              Choice
            </p>
          </button>
        </Link>
        <Link href="/start">
          <button
            style={{ fontFamily: 'continuous' }}
            className="cursor-pointer flex items-center justify-center "
          >
            <img src="/choicebutton.png" alt="choice" />
            <p className="text-3xl hover:text-white mt-1 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)]">
              Reject
            </p>
          </button>
        </Link>
      </div>
    </div>
  );
}
