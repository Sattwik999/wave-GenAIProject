
export default function Home(){
  return (
    <div className="grid gap-4">
      <header className="text-center">
        <h1 className="text-3xl font-semibold">WAVE — Wellbeing Advisor with Voice Empathy</h1>
        <p className="opacity-80 mt-2">Privacy-first mental wellness tools with a Google-grade, minimal UI.</p>
      </header>
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          ['/chat','Empathetic Chat','Supportive replies with Gemini'],
          ['/mood','Mood','Log your mood (1–5)'],
          ['/journal','Journal','Write & reflect'],
          ['/pulse','Community Pulse','Weekly averages'],
          ['/ar','Calming Scenery','Forest / Beach / Mountain'],
          ['/crisis','Panic','Breathing + helplines'],
          ['/settings','Settings','Theme, shield, data'],
        ].map(([to, title, desc]) => (
          <a key={to as string} href={to as string} className="card p-4 hover:scale-[1.01] transition">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="opacity-80 mt-1">{desc}</p>
          </a>
        ))}
      </section>
    </div>
  )
}
