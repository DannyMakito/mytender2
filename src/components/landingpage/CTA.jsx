import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-red-400/15 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm border border-orange-200/50 shadow-2xl shadow-orange-900/20">
          <CardContent className="p-12 text-center">
            <div className="inline-block px-6 py-2 mb-6 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full">
              <span className="text-orange-700 font-medium">🚀 Ready to Transform Your Business?</span>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to <span className="text-orange-600">Win More Tenders?</span>
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Join thousands of energized businesses that use TenderWin to discover opportunities and accelerate their growth with unprecedented success.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all duration-300 transform hover:scale-105">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300">
                Schedule Demo
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="group">
                <div className="text-3xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform duration-300">10,000+</div>
                <div className="text-gray-600">Active Tenders</div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform duration-300">85%</div>
                <div className="text-gray-600">Success Rate Improvement</div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform duration-300">5,000+</div>
                <div className="text-gray-600">Happy Businesses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}