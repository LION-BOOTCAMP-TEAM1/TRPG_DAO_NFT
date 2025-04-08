import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface TooltipPortalProps {
  children: React.ReactNode;
  position: { x: number; y: number };
  visible: boolean;
}

export default function TooltipPortal({ children, position, visible }: TooltipPortalProps) {
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      className={`fixed z-50 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
