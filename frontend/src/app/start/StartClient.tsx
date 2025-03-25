'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function StartClient() {
  const [isChecked, setIsChecked] = useState(false);

  const handleChecked = () => {
    setIsChecked(!isChecked);
  };
  return (
    <div className="relative h-screen w-screen">
      <img
        src="/image5.png"
        alt="Start Page"
        className="object-fill h-full w-full"
      />

      <div className="flex flex-col z-10 absolute top-8/44 left-7/19 bg-[#f4e1c1] bg-gradient-to-r from-[#f8e1c1] to-[#e1d7b9] justify-center items-center gap-2 border border-gray-400 p-10 ">
        <div>
          <h1 className="text-4xl  font-bold italic drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)] pb-20">
            Character
          </h1>
        </div>
        <h1 className="text-4xl  font-bold italic drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)] pb-5">
          Gender
        </h1>
        {isChecked ? (
          <button
            className="cursor-pointer flex items-center pb-10"
            onClick={handleChecked}
          >
            <img
              src="/checkbuttonoff.png"
              className="w-5 h-5 hover:bg-green-50 rounded-2xl"
              alt="CheckButtonOff"
            />
            <p className="mb-1 text-xl  font-bold italic flex pr-20 pt-1">
              Male
            </p>
            <button
              className="cursor-pointer flex flex-row items-center "
              onClick={handleChecked}
            >
              <img
                src="/checkbuttonoff.png"
                className="w-5 h-5 hover:bg-green-50 rounded-2xl"
                alt="CheckButtonOff"
              />
              <p className="mb-1 text-xl font-bold italic pt-1">FeMale</p>
            </button>
          </button>
        ) : (
          <button
            className="cursor-pointer flex items-center pb-10 "
            onClick={handleChecked}
          >
            <img
              src="/checkbuttonon.png"
              className="w-5 h-5 hover:bg-green-50 rounded-2xl"
              alt="CheckButtonOff"
            />
            <p className="mb-1 text-xl  font-bold italic flex pr-20 pt-1">
              Male
            </p>
            <button
              className="cursor-pointer flex flex-row items-center"
              onClick={handleChecked}
            >
              <img
                src="/checkbuttonon.png"
                className="w-5 h-5 hover:bg-green-50 rounded-2xl"
                alt="CheckButtonOff"
              />
              <p className="mb-1 text-xl font-bold italic pt-1">FeMale</p>
            </button>
          </button>
        )}
        <h1 className="text-4xl  font-bold italic drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)] pb-5">
          Class
        </h1>
        <button className="cursor-pointer flex items-center">
          <img
            src="/checkbuttonoff.png"
            className="w-5 h-5 hover:bg-green-50 rounded-2xl"
            alt="CheckButtonOff"
          />
          <p className="mb-1 text-xl  font-bold italic flex pr-20 pt-1">
            Wizard
          </p>
          <button className="cursor-pointer flex flex-row items-center">
            <img
              src="/checkbuttonoff.png"
              className="w-5 h-5 hover:bg-green-50 rounded-2xl"
              alt="CheckButtonOff"
            />
            <p className="mb-1 text-xl font-bold italic pt-1 pr-20">Warrior</p>
          </button>
          <button className="cursor-pointer flex flex-row items-center">
            <img
              src="/checkbuttonoff.png"
              className="w-5 h-5 hover:bg-green-50 rounded-2xl"
              alt="CheckButtonOff"
            />
            <p className="mb-1 text-xl font-bold italic pt-1">Archer</p>
          </button>
        </button>
        <form>
          <div>
            <h1 className="text-4xl text-center font-bold italic drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)] pt-10 pb-10">
              Brave
            </h1>
            <input
              placeholder="User Name"
              className="text-center  border border-gray-500 rounded-2xl ml-19"
              type="text"
            />
            <button className=" font-bold border-2 bg-[#c2bfb9]  rounded-2xl px-2 cursor-pointer hover:bg-gray-200 mx-2">
              check
            </button>
          </div>
          <div className="flex justify-center items-center p-4 mt-10">
            <Link href={'/prologue'}>
              <button className=" text-xl font-bold border-2 bg-[#c2bfb9]  rounded-2xl px-2 cursor-pointer hover:bg-gray-200">
                Create
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
