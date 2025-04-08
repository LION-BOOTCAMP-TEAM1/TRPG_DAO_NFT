"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Item } from "@/store/types";

interface ItemModalProps {
    item: Item;
    equippedItem: Item | null;
    onClose: () => void;
    onEquip: (item: Item) => void;
}

const renderStats = (item: Item) => {
  if (!item.stat) return <p className="text-sm text-gray-500">스탯 없음</p>;

  return (
    <div className="flex flex-col">
        <div className="grid grid-cols-2 gap-1 text-sm mt-1">
            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
            <img src="/attack.png" alt="공격력" className="w-5 h-5" />
            <span className={`${item.stat.attack ? "text-white" : "text-gray-500"} text-sm font-medium`}>+{item.stat.attack ?? 0}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
            <img src="/magic.png" alt="마법력" className="w-5 h-5" />
            <span className={`${item.stat.magic ? "text-white" : "text-gray-500"} text-sm font-medium`}>+{item.stat.magic ?? 0}</span>
            </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1 text-sm mt-1">
            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
            <img src="/str.png" alt="STR" className="w-5 h-5" />
            <span className={`${item.stat.strength ? "text-white" : "text-gray-500"} text-sm font-medium`}>+{item.stat.strength ?? 0}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
            <img src="/agi.png" alt="AGI" className="w-5 h-5" />
            <span className={`${item.stat.agility ? "text-white" : "text-gray-500"} text-sm font-medium`}>+{item.stat.agility ?? 0}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
            <img src="/int.png" alt="INT" className="w-5 h-5" />
            <span className={`${item.stat.intelligence ? "text-white" : "text-gray-500"} text-sm font-medium`}>+{item.stat.intelligence ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
            <img src="/chr.png" alt="CHR" className="w-5 h-5" />
            <span className={`${item.stat.charisma ? "text-white" : "text-gray-500"} text-sm font-medium`}>+{item.stat.charisma ?? 0}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
            <img src="/health.png" alt="HEALTH" className="w-5 h-5" />
            <span className={`${item.stat.health ? "text-white" : "text-gray-500"} text-sm font-medium`}>+{item.stat.health ?? 0}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-600 rounded p-1 justify-center">
            <img src="/wis.png" alt="WIS" className="w-5 h-5" />
            <span className={`${item.stat.wisdom ? "text-white" : "text-gray-500"} text-sm font-medium`}>+{item.stat.wisdom ?? 0}</span>
            </div>            
        </div>
    </div>
  );
};

const ItemModal = ({ item, equippedItem, onClose, onEquip }: ItemModalProps) => {
    return (
        <AnimatePresence>
        <motion.div
            className="fixed inset-0 z-50 bg-fantasy-surface/80 dark:bg-[var(--fantasy-surface)]/80 bg-opacity-60 flex items-center justify-center"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
        >
            <motion.div
            className="bg-[#c6beab] rounded-lg p-6 w-[700px] max-w-full shadow-lg relative flex gap-4"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25 }}
            >
            {/* 닫기 버튼 */}
            <button
                className="absolute top-3 right-4 text-gray-500 hover:text-red-600 text-xl"
                onClick={onClose}
            >
                ✕
            </button>

            {/* 왼쪽: 착용 중인 아이템 */}
            <div className="flex-1 border-r pr-4">
                <h3 className="text-lg font-semibold mb-2 text-black">현재 착용 중</h3>
                {equippedItem ? (
                <div>
                    <img
                    src={equippedItem.image}
                    alt={equippedItem.name}
                    className="w-full h-auto object-cover rounded"
                    />
                    <p className="mt-2 font-medium">{equippedItem.name}</p>
                    <p className="text-sm text-gray-500">{equippedItem.description ?? "설명 없음"}</p>
                    {renderStats(equippedItem)}
                </div>
                ) : (
                <p className="text-sm text-gray-500 text-center p-4">착용 중인 아이템 없음</p>
                )}
            </div>

            {/* 오른쪽: 선택된 아이템 */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                <h3 className="text-lg font-semibold mb-2 text-black">선택한 아이템</h3>
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-auto object-cover rounded"
                />
                <p className="mt-2 font-medium text-black">{item.name}</p>
                <p className="text-sm text-gray-500">{item.description ?? "설명 없음"}</p>
                {renderStats(item)}
                </div>

                {/* 👇 우측 하단 장비하기 버튼 */}
                <div className="flex justify-end mt-4">
                <button
                    className="px-4 py-2 bg-[#413029] hover:bg-[#31241f] text-white rounded shadow"
                    onClick={() => onEquip(item)}
                >
                    장비하기
                </button>
                </div>
            </div>
            </motion.div>
        </motion.div>
        </AnimatePresence>
    );
};

export default ItemModal;
