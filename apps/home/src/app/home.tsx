const LANGUAGES = [
  {
    id: 'eng',
    name: 'English',
    fixture: 'engEnglish4',
    icon: 'A',
    color: 'bg-blue-100 text-blue-600',
    description: 'Explore the foundations of AlphaTilesAgain with our comprehensive English build.',
  },
  {
    id: 'yue',
    name: 'Cantonese',
    fixture: 'yueCantonese',
    icon: '粵',
    color: 'bg-red-100 text-red-600',
    description: 'Master Jyutping and traditional characters in our Cantonese literacy module.',
  },
];

const ABOUT_POINTS = [
  'Easy-to-provide asset structure',
  'Support for complex scripts and RTL',
  'Multiple interactive game modes',
  'Available on iOS, Android, and Web',
] as const;

const HOW_IT_WORKS = [
  { step: '01', title: 'Gather Assets', desc: 'Provide word lists, phoneme data, audio recordings, and images in a simple folder structure.' },
  { step: '02', title: 'Generate App', desc: 'The AlphaTilesAgain engine validates your assets and generates a customized game shell for your language.' },
  { step: '03', title: 'Publish & Play', desc: 'Deploy your app to the web or mobile stores and start building literacy in your community.' },
] as const;

export function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">AlphaTilesAgain</span>
        </div>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
          <a href="#languages" className="hover:text-primary transition-colors">Languages</a>
          <a href="#about" className="hover:text-primary transition-colors">About</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
          <a href="https://alphatilesapps.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">alphatilesapps.org</a>
        </div>
        <a href="#languages" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary transition-colors shadow-sm">
          Get Started
        </a>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="px-6 py-20 md:py-32 bg-gradient-to-b from-white to-slate-50 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Literacy games for <span className="text-primary underline decoration-blue-200 underline-offset-8">every</span> language.
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              AlphaTilesAgain is a community-extended fork of AlphaTiles — adding new languages, new games, and web + iOS support.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a href="#languages" className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all transform hover:-translate-y-1 shadow-md">
                Explore Languages
              </a>
              <a href="#about" className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm">
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Language Grid */}
        <section id="languages" className="px-6 py-24 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Interactive Language Builds</h2>
            <p className="text-slate-600">Choose a language build to explore the AlphaTilesAgain experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {LANGUAGES.map((lang) => (
              <div key={lang.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 p-8 flex flex-col items-center text-center">
                <div className={`w-20 h-20 ${lang.color} rounded-2xl flex items-center justify-center text-3xl font-bold mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {lang.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{lang.name}</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  {lang.description}
                </p>
                <div className="mt-auto w-full">
                  <a href={`./${lang.fixture}/`} className="block w-full bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl border border-slate-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors text-center">
                    Launch Build
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-slate-900 text-white py-24 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8">Preserving language through play.</h2>
              <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                Minority language communities often lack educational resources. AlphaTilesAgain bridges this gap by providing a platform to create high-quality, culturally relevant literacy games — built on the foundation of the original <a href="https://alphatilesapps.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">AlphaTiles</a> project.
              </p>
              <ul className="space-y-4">
                {ABOUT_POINTS.map((item) => (
                  <li key={item} className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800 rounded-3xl p-8 aspect-video flex items-center justify-center border border-slate-700 shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-blue-500 opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="text-center z-10">
                <div className="text-6xl mb-4">🎮</div>
                <div className="font-mono text-blue-400 tracking-widest text-sm uppercase font-bold">App Screenshot Coming Soon</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="px-6 py-24 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How it Works</h2>
            <p className="text-slate-600">The journey from raw assets to a fully playable literacy game.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative">
                <div className="text-8xl font-black text-slate-50 absolute -top-10 -left-4 select-none -z-10">{item.step}</div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold text-xs">A</div>
            <span className="font-bold text-slate-800">AlphaTilesAgain</span>
          </div>
          <div className="text-slate-500 text-sm text-center md:text-right">
            © 2026 AlphaTilesAgain. Built on <a href="https://alphatilesapps.org" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 underline">AlphaTiles</a>.
          </div>
        </div>
      </footer>
    </div>
  );
}
