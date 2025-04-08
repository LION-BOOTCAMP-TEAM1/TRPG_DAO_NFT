import { useEffect, useState } from "react";
import { setApprovalForAll, isApprovedForAll } from "@/utils/web3";

export default function ApproveButton({onApproved, refresh}: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [isApproved, setIsApproved] = useState(false);

    const fetchApproval = async () => {
        const result = await isApprovedForAll();
        setIsApproved(result);
    };

    useEffect(() => {
        fetchApproval();
    }, [])

    useEffect(() => {
        fetchApproval();
      }, [refresh]);

    useEffect(() => {
        if (isApproved && onApproved) {
            onApproved(); // ✅ 부모에게 알림
          }
    }, [isApproved])

  const handleApproval = async () => {
    setIsLoading(true);
    const result = await setApprovalForAll(); // 실제 함수 호출
    if (result === true) {
      setIsApproved(true);
    }
    setIsLoading(false);
  };

  return (
    <button
      className={`px-3 py-1 rounded text-xs text-white ${
        isApproved ? "bg-gray-600 cursor-default" : "bg-green-600"
      }`}
      onClick={handleApproval}
      disabled={isApproved || isLoading}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          승인 중...
        </span>
      ) : isApproved ? (
        "승인됨"
      ) : (
        "NFT 승인"
      )}
    </button>
  );
}
