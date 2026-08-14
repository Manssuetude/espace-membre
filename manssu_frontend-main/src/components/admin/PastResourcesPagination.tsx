const PastResourcesPagination = () => {
  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <button className="px-4 py-2 bg-gradient-to-r from-primary to-red-500 text-white rounded-lg font-medium shadow-lg">
        1
      </button>
      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
        2
      </button>
      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
        3
      </button>
      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );
};

export default PastResourcesPagination;
