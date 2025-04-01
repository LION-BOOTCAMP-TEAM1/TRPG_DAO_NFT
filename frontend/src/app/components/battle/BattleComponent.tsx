"use client";

import { motion, AnimatePresence } from "framer-motion";

interface BattleComponentProps {
    onClose: () => void;
}

const BattleComponent = ({ onClose }: BattleComponentProps) => {
    return (
        <AnimatePresence>
        <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center"
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
            배틀 화면
            </motion.div>
        </motion.div>
        </AnimatePresence>
    );
};

export default BattleComponent;
