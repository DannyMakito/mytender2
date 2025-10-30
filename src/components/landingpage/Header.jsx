import { useState } from "react";
import { Button } from "@/components/ui/button"
import SignInModal from "./SignInModal";
import GetStartedModal from "./GetStartedModal";

export function Header() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isGetStartedModalOpen, setIsGetStartedModalOpen] = useState(false);
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-orange-200/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded shadow-lg"></div>
          <span className="text-xl font-semibold text-orange-600">MyTender</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
            Features
          </a>
          <a href="#how-it-works" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
            How It Works
          </a>
          <a href="#pricing" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
            Pricing
          </a>
          <a href="#contact" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="text-gray-700 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => setIsSignInModalOpen(true)}
          >
            Sign In
          </Button>
          <Button 
          
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
            onClick={() => setIsGetStartedModalOpen(true)}
          >
            Get Started
          </Button>
        </div>
      </div>
      
      <SignInModal 
        isOpen={isSignInModalOpen} 
        onClose={() => setIsSignInModalOpen(false)} 
      />
      <GetStartedModal 
        isOpen={isGetStartedModalOpen} 
        onClose={() => setIsGetStartedModalOpen(false)} 
      />
    </header>
  );
}