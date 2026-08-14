import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = ({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-gray-300 hover:text-white hover:bg-gray-700/50"
      >
        <div className="flex items-center">
          <i className={`fa-solid ${icon} w-5 mr-3`}></i>
          <span className="font-medium">{title}</span>
        </div>
        <i className={`fa-solid fa-chevron-${isOpen ? "up" : "down"} text-sm transition-transform`}></i>
      </button>
      {isOpen && <div className="mt-1 space-y-1 pl-4">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
