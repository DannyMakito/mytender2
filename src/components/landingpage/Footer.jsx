export function Footer() {
    return (
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white py-12 relative overflow-hidden">
        {/* Subtle Orange Glow */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded shadow-lg"></div>
                <span className="text-xl font-semibold text-orange-300">TenderWin</span>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Energizing businesses to win more tenders and accelerate growth through smart matching and expert guidance.
              </p>
            </div>
  
            <div>
              <h4 className="font-semibold mb-4 text-orange-300">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-orange-300 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Documentation</a></li>
              </ul>
            </div>
  
            <div>
              <h4 className="font-semibold mb-4 text-orange-300">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-orange-300 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Contact</a></li>
              </ul>
            </div>
  
            <div>
              <h4 className="font-semibold mb-4 text-orange-300">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-orange-300 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-300 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
  
          <div className="border-t border-gray-700/50 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TenderWin. All rights reserved. <span className="text-orange-400">Energizing Business Success</span></p>
          </div>
        </div>
      </footer>
    );
  }