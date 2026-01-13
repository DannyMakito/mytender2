import { Button } from '@/components/ui/button'
import { ImageWithFallback } from "../figma/ImageWithFallback";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1642522029691-029b5a432954?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBwcm9mZXNzaW9uYWwlMjBvZmZpY2V8ZW58MXx8fHwxNzU1NTUyNDI2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Professional business meeting"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/70 via-orange-800/60 to-amber-900/50"></div>
      </div>

      {/* Animated Orange Accent Elements */}
      <div className="absolute inset-0 z-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-500 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-amber-400 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-orange-400 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
         
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent">
            Win More Tenders for Your Business
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-2xl mx-auto">
            Energize your growth with our AI-powered platform. Connect with government and private sector opportunities that fuel your success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all duration-300 transform hover:scale-105">
              Start Finding Tenders
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 border-orange-400 text-orange-100 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300 bg-transparent">
              learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-orange-200 animate-bounce">
        <div className="w-6 h-10 border-2 border-orange-300 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-orange-300 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
}