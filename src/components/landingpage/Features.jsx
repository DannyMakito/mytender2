import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Features() {
  const features = [
    {
      title: "Smart Tender Matching",
      description: "Our AI-powered system matches you with relevant tenders based on your business profile and expertise.",
      icon: "🎯",
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "Real-time Notifications",
      description: "Get instant alerts when new tenders matching your criteria are published. Never miss an opportunity.",
      icon: "⚡",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      title: "Streamlined Applications",
      description: "Simplified application process with document templates and automated form filling to save you time.",
      icon: "📄",
      gradient: "from-orange-400 to-amber-400"
    },
    {
      title: "Competitive Analysis",
      description: "Access insights about your competitors and market trends to strengthen your tender submissions.",
      icon: "📊",
      gradient: "from-red-500 to-orange-600"
    },
    {
      title: "Success Tracking",
      description: "Monitor your tender success rate and get recommendations to improve your win percentage.",
      icon: "📈",
      gradient: "from-orange-600 to-amber-600"
    },
    {
      title: "Expert Support",
      description: "Get guidance from our team of tender specialists to optimize your applications and strategy.",
      icon: "🤝",
      gradient: "from-amber-400 to-orange-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 mb-4 bg-orange-200/50 rounded-full">
            <span className="text-orange-700 font-medium">🔥 Powerful Features</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to <span className="text-orange-600">Win Tenders</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Energize your business with powerful tools and insights designed to fuel your success in the competitive tender landscape.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-2 border border-orange-200/50 bg-white/80 backdrop-blur-sm group">
              <CardHeader>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-xl text-gray-900 group-hover:text-orange-700 transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}