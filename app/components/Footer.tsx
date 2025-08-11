const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <p className="text-xs md:text-sm text-gray-600">
            © 2025 AI Assistent. Alle rechten voorbehouden.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Voorwaarden
            </a>
            <a href="#" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Help
            </a>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs md:text-sm text-gray-600">Systeem Online</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;