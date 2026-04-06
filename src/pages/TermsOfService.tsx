import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-emerald-500 hover:text-emerald-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zpět
        </button>
        
        <h1 className="text-3xl font-bold mb-6 text-emerald-500">Podmínky použití</h1>
        
        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">1. Přijetí podmínek</h2>
            <p>
              Registrací a používáním aplikace ConnectChat souhlasíte s těmito Podmínkami použití. Pokud s těmito podmínkami nesouhlasíte, aplikaci prosím nepoužívejte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">2. Způsobilost</h2>
            <p>
              Aplikace je určena pro uživatele starší 15 let. Používáním aplikace potvrzujete, že splňujete tuto věkovou hranici.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">3. Uživatelský účet a bezpečnost</h2>
            <p>
              Jste zodpovědní za udržování důvěrnosti svých přihlašovacích údajů a za všechny aktivity, které se pod vaším účtem odehrají. Pokud máte podezření na zneužití účtu, neprodleně nás kontaktujte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">4. Pravidla chování a obsah</h2>
            <p>Při používání aplikace se zavazujete, že nebudete:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Nahrávat, sdílet nebo šířit obsah, který je nezákonný, urážlivý, nenávistný, pornografický nebo jinak nevhodný.</li>
              <li>Obtěžovat, šikanovat nebo vyhrožovat ostatním uživatelům.</li>
              <li>Vydávat se za jinou osobu nebo subjekt.</li>
              <li>Rozesílat spam, nevyžádanou reklamu nebo škodlivý kód (viry).</li>
              <li>Zneužívat aplikaci k nezákonným účelům.</li>
            </ul>
            <p className="mt-2">Vyhrazujeme si právo odstranit jakýkoliv obsah, který porušuje tato pravidla, a zablokovat nebo smazat účty uživatelů, kteří se těchto porušení dopustí.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">5. Odpovědnost</h2>
            <p>
              Aplikace ConnectChat je poskytována "tak jak je". Neneseme odpovědnost za obsah vytvořený uživateli, ani za případné škody vzniklé používáním aplikace. Komunikace a interakce s ostatními uživateli je na vaše vlastní riziko.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">6. Změny podmínek</h2>
            <p>
              Vyhrazujeme si právo tyto Podmínky použití kdykoliv upravit. O významných změnách vás budeme informovat. Pokračováním v používání aplikace po provedení změn vyjadřujete svůj souhlas s novými podmínkami.
            </p>
          </section>

          <p className="text-sm text-zinc-500 mt-8">
            Poslední aktualizace: {new Date().toLocaleDateString('cs-CZ')}
          </p>
        </div>
      </div>
    </div>
  );
}
