interface AwardBadgeDotProps {
  show: boolean;
}

/** Small gold medal dot overlaid on an avatar when the member has at least one permanent award win. */
const AwardBadgeDot = ({ show }: AwardBadgeDotProps) => {
  if (!show) return null;
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-award-gold ring-2 ring-white flex items-center justify-center text-[10px] text-award-ink"
      title="A remporté un Award"
      aria-label="A remporté un Award"
    >
      <i className="fa-solid fa-trophy"></i>
    </span>
  );
};

export default AwardBadgeDot;
