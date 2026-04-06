import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
        
        <h1 className="text-3xl font-bold mb-6 text-emerald-500">Zásady ochrany osobních údajů</h1>
        
        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">1. Úvod</h2>
            <p>
              Tyto zásady ochrany osobních údajů vysvětlují, jak shromažďujeme, používáme, sdílíme a chráníme vaše osobní údaje při používání aplikace ConnectChat. Vaše soukromí je pro nás důležité a zavazujeme se jej chránit v souladu s platnými právními předpisy, včetně GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">2. Jaké údaje shromažďujeme</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Základní údaje:</strong> E-mailová adresa, jméno (přezdívka) a profilová fotografie.</li>
              <li><strong>Údaje o poloze:</strong> Pokud nám k tomu dáte výslovný souhlas, shromažďujeme údaje o vaší aktuální poloze pro zobrazení na mapě a sdílení s ostatními uživateli.</li>
              <li><strong>Obsah komunikace:</strong> Zprávy, obrázky a ankety, které odesíláte prostřednictvím našeho chatu.</li>
              <li><strong>Profilové informace:</strong> Vaše zájmy, status a fotografie nahrané do galerie.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">3. Jak údaje používáme</h2>
            <p>Vaše údaje používáme výhradně za účelem:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Poskytování a vylepšování funkcí aplikace ConnectChat.</li>
              <li>Zprostředkování komunikace mezi vámi a ostatními uživateli.</li>
              <li>Zobrazení vaší polohy na mapě (pouze s vaším souhlasem).</li>
              <li>Zajištění bezpečnosti a prevence podvodů.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">4. Sdílení údajů</h2>
            <p>
              Vaše údaje nesdílíme s třetími stranami pro marketingové účely. Údaje mohou být uloženy na serverech poskytovatelů cloudových služeb (např. Google Firebase), kteří splňují přísné bezpečnostní standardy. Vaše veřejné profilové informace a poloha (pokud je sdílena) jsou viditelné pro ostatní registrované uživatele aplikace.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">5. Vaše práva</h2>
            <p>V souladu s GDPR máte právo na:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Přístup ke svým osobním údajům.</li>
              <li>Opravu nepřesných údajů.</li>
              <li>Výmaz vašich údajů ("právo být zapomenut").</li>
              <li>Odvolání souhlasu se zpracováním polohy.</li>
            </ul>
            <p className="mt-2">Pro uplatnění těchto práv nás můžete kontaktovat nebo využít funkce přímo v nastavení profilu aplikace.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">6. Zabezpečení</h2>
            <p>
              Přijímáme přiměřená technická a organizační opatření k ochraně vašich údajů před neoprávněným přístupem, ztrátou nebo zneužitím. Komunikace je šifrována a přístup k databázím je přísně omezen.
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
