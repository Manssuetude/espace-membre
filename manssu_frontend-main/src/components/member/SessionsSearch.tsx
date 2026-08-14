const SessionsSearch = () => {
  return (
    <div className="relative flex-1 sm:flex-initial sm:w-64">
      <input
        type="text"
        placeholder="Rechercher une session..."
        className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 transition-all w-full"
      />
      <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
    </div>
  );
};

export default SessionsSearch;
