const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            © 2025 AI Assistent. Alle rechten voorbehouden.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              Voorwaarden
            </a>
            <a href="#" className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              Help
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Systeem Online</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;