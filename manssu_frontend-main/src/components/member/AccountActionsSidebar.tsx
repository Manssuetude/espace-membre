interface AccountActionsSidebarProps {
  onLogout: () => void;
}

const AccountActionsSidebar = ({ onLogout }: AccountActionsSidebarProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fa-solid fa-cog mr-3 text-gray-600"></i>
        Actions du compte
      </h3>
      <div className="space-y-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
        >
          <i className="fa-solid fa-sign-out-alt mr-3"></i>
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default AccountActionsSidebar;
