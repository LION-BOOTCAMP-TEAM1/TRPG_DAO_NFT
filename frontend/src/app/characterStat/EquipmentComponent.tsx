'use client';

import TabComponent from "./TabComponent";
import ItemComponent from "./ItemComponent";
import { useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { Item } from "../../store/types";
import { useEffect, useState } from "react";
import ItemModal from "./ItemModal";
import {equipItem} from "../../store/characterSlice"
import { useDispatch } from "react-redux";

const EquipmentComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const myNFTs = useSelector((state: RootState) => state.character);
  const [weapons, setWeapons] = useState<Item[]>([]);
  const [armors, setArmors] = useState<Item[]>([]);
  const [accessories, setAccessories] = useState<Item[]>([]);
  const [titles, setTitles] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [equippedItem, setEquippedItem] = useState<Item | null>(null);

  useEffect(() => {
    if(selectedItem) {
      switch(selectedItem.type){
        case 1:
          setEquippedItem(myNFTs.equipment.weapon)
          break;
        case 2:
          setEquippedItem(myNFTs.equipment.armor)
          break;
        case 3:
          setEquippedItem(myNFTs.equipment.accessory)
          break;
        case 4:
          setEquippedItem(myNFTs.equipment.title)
          break;
      }      
    }    
  }, [selectedItem]);

  useEffect(() => {
    setWeapons(myNFTs.inventory.filter(i => i.type === 1));
    setArmors(myNFTs.inventory.filter(i => i.type === 2));
    setAccessories(myNFTs.inventory.filter(i => i.type === 3));
    setTitles(myNFTs.inventory.filter(i => i.type === 4));
  }, [myNFTs]);

  return (
    <div>
      <div className='flex flex-col justify-start'>
        {/* 장비중 아이템 */}
        <p className="m-1">장비중 아이템</p>
        <div className="flex flex-wrap justify-between mb-4">
          <div className="p-1 bg-gray-600 w-[22%] h-auto">
            <img 
              src={myNFTs.equipment.weapon ? myNFTs.equipment.weapon.image : "/slot1.png"} 
              className="rounded"
            />
          </div>
          <div className="p-1 bg-gray-600 w-[22%] h-auto">
            <img 
              src={myNFTs.equipment.armor ? myNFTs.equipment.armor.image : "/slot2.png"}
              className="rounded"
            />
          </div>
          <div className="p-1 bg-gray-600 w-[22%] h-auto">
            <img 
              src={myNFTs.equipment.accessory ? myNFTs.equipment.accessory.image : "/slot3.png"}
              className="rounded"
            />
          </div>
          <div className="p-1 bg-gray-600 w-[22%] h-auto">
            <img 
              src={myNFTs.equipment.title ? myNFTs.equipment.title.image : "/slot4.png"}
              className="rounded"
            />
          </div>
        </div>

        {/* 능력치 */}
        <div className="aspect-[16/4] bg-[url('/stat.png')] bg-cover bg-center px-2 py-4 flex flex-col justify-center items-center mb-4">
          <div className="grid grid-cols-2 gap-4 p-1 rounded shadow-inner w-full">
            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/attack.png" alt="공격력" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+{myNFTs.stats.attack}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/magic.png" alt="마법력" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+{myNFTs.stats.magic}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 p-1 rounded shadow-inner w-full">
            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/str.png" alt="STR" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+{myNFTs.stats.strength}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/agi.png" alt="AGI" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+{myNFTs.stats.agility}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/int.png" alt="INT" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+{myNFTs.stats.intelligence}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/chr.png" alt="CHR" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+{myNFTs.stats.charisma}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/health.png" alt="HEALTH" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+{myNFTs.stats.health}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
              <img src="/wis.png" alt="WIS" className="w-5 h-5" />
              <span className="text-sm text-white font-medium">+{myNFTs.stats.wisdom}</span>
            </div>            
          </div>
        </div>

        {/* 내 아이템 및 NFT */}
        <TabComponent 
          tabs={['무기', '방어구', '악세사리', '칭호']}
          contents={[
            <div key="1">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
                <div className="grid grid-cols-5 w-full justify-items-center gap-y-4 p-4">
                {Object.values(weapons).map((item, index) => (
                  <ItemComponent item={item} key={index} clickEvent={(item) => setSelectedItem(item)} />
                ))}
                </div>
              </div>
            </div>,
            <div key="2">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
                <div className="grid grid-cols-5 w-full justify-items-center gap-y-4 p-4">
                  {Object.values(armors).map((item, index) => (
                    <ItemComponent item={item} key={index} clickEvent={(item) => setSelectedItem(item)} />
                  ))}
                </div>
              </div>
            </div>,
            <div key="3">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
                <div className="grid grid-cols-5 w-full justify-items-center gap-y-4 p-4">
                  {Object.values(accessories).map((item, index) => (
                    <ItemComponent item={item} key={index} clickEvent={(item) => setSelectedItem(item)} />
                  ))}
                </div>
              </div>
            </div>,
            <div key="4">
              <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
                <div className="grid grid-cols-5 w-full justify-items-center gap-y-4 p-4">
                  {Object.values(titles).map((item, index) => (
                    <ItemComponent item={item} key={index} clickEvent={(item) => setSelectedItem(item)} />
                  ))}
                </div>
              </div>
            </div>
          ]}
        />
      </div>
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          equippedItem={equippedItem}
          onClose={() => setSelectedItem(null)}
          onEquip={(v) => {
            dispatch(equipItem(v));
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

export default EquipmentComponent;
