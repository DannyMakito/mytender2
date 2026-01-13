export function HowItWorks() {
    const steps = [
      {
        step: "1",
        title: "Create Your Profile",
        description: "Tell us about your business, capabilities, and the types of tenders you're interested in.",
        color: "from-orange-500 to-red-500"
      },
      {
        step: "2",
        title: "Get Matched",
        description: "Our system automatically finds and recommends tenders that match your business profile.",
        color: "from-amber-500 to-orange-500"
      },
      {
        step: "3",
        title: "Apply with Confidence",
        description: "Use our tools and templates to create compelling tender submissions that stand out.",
        color: "from-orange-400 to-amber-400"
      },
      {
        step: "4",
        title: "Track & Improve",
        description: "Monitor your applications and get insights to continuously improve your success rate.",
        color: "from-red-500 to-orange-600"
      }
    ];
  
    return (
      <section id="how-it-works" className="py-20 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-orange-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 right-32 w-40 h-40 bg-amber-400 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-orange-500 rounded-full blur-lg"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 mb-4 bg-orange-100 rounded-full">
              <span className="text-orange-700 font-medium">⚡ Simple Process</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How <span className="text-orange-600">TenderWin</span> Works
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              A simple, energizing process designed to accelerate your tender success and fuel your business growth.
            </p>
          </div>
  
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 bg-gradient-to-br ${item.color} text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-all duration-300`}>
                      {item.step}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-orange-300 to-amber-300 transform translate-x-4"></div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }