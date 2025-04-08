import { GrRadialSelected } from 'react-icons/gr';
import { FaRegCircle } from 'react-icons/fa';

export default function CharacterClassSelection({
  characterClasses,
  selectedClass,
  setSelectedClass,
  isCreated,
}: {
  characterClasses: any[];
  selectedClass: any;
  setSelectedClass: (charClass: any) => void;
  isCreated: boolean;
}) {

  return (
    <div className="mt-4 ">
      {characterClasses.length > 0 ? (
        <ul className="space-y-2 flex flex-row gap-10 ">
          {characterClasses.map((charClass: any) => (
            <li
              key={charClass.id}
              className=" px-2 mb-10 rounded shadow justify-between items-center  "
            >
              <button
                className={` ${
                  selectedClass?.id === charClass.id
                }  rounded-3xl hover:bg-green-300 `}
                onClick={() => setSelectedClass(charClass)}
                disabled={isCreated}
              >
                {selectedClass?.id === charClass.id ? (
                  <div>
                    <GrRadialSelected />
                  </div>
                ) : (
                  <FaRegCircle />
                )}
              </button>
              <span className="text-lg pl-2 ">{charClass.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loding...</p>
      )}
    </div>
  );
}
