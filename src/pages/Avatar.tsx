import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Crown, Star, Sparkles, Check, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import AvatarDisplay, { AVATAR_ASSETS } from '../components/AvatarDisplay';

const PACKAGES = [
  { 
    id: 'basic', 
    name: 'Základní balíček', 
    price: 5, 
    icon: Star,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
    features: ['Základní péče o avatara', '1 styl oblečení'] 
  },
  { 
    id: 'extended', 
    name: 'Rozšířený balíček', 
    price: 10, 
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/50',
    features: ['Pokročilá péče', '3 druhy oblečení', '2 účesy'] 
  },
  { 
    id: 'premium', 
    name: 'Vícerozšířený balíček', 
    price: 15, 
    icon: Crown,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/50',
    features: ['Prémiová péče', '9 druhů oblečení', '6 účesů', 'Exkluzivní styly'] 
  }
];

const AVATAR_ASSETS = {
  clothes: {
    basic: [{ id: 'tshirt', name: 'Základní tričko', color: '#3b82f6' }],
    extended: [
      { id: 'tshirt', name: 'Základní tričko', color: '#3b82f6' },
      { id: 'hoodie', name: 'Mikina', color: '#8b5cf6' },
      { id: 'jacket', name: 'Bunda', color: '#10b981' }
    ],
    premium: [
      { id: 'tshirt', name: 'Základní tričko', color: '#3b82f6' },
      { id: 'hoodie', name: 'Mikina', color: '#8b5cf6' },
      { id: 'jacket', name: 'Bunda', color: '#10b981' },
      { id: 'suit', name: 'Oblek', color: '#18181b' },
      { id: 'dress', name: 'Šaty', color: '#ec4899' },
      { id: 'tank', name: 'Tílko', color: '#f59e0b' },
      { id: 'sweater', name: 'Svetr', color: '#ef4444' },
      { id: 'coat', name: 'Kabát', color: '#78350f' },
      { id: 'sport', name: 'Sportovní', color: '#06b6d4' }
    ]
  },
  hair: {
    basic: [{ id: 'none', name: 'Bez vlasů' }],
    extended: [
      { id: 'none', name: 'Bez vlasů' },
      { id: 'short', name: 'Krátké' },
      { id: 'long', name: 'Dlouhé' }
    ],
    premium: [
      { id: 'none', name: 'Bez vlasů' },
      { id: 'short', name: 'Krátké' },
      { id: 'long', name: 'Dlouhé' },
      { id: 'curly', name: 'Kudrnaté' },
      { id: 'spiky', name: 'Ježek' },
      { id: 'ponytail', name: 'Culík' }
    ]
  }
};

export default function Avatar() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const currentPackage = userProfile?.avatarPackage || 'none';
  const [config, setConfig] = useState({
    clothes: userProfile?.avatarConfig?.clothes || 'tshirt',
    hair: userProfile?.avatarConfig?.hair || 'none'
  });

  useEffect(() => {
    if (userProfile?.avatarConfig) {
      setConfig(userProfile.avatarConfig);
    }
  }, [userProfile]);

  const handlePurchase = async (pkgId: string) => {
    if (!user) return;
    // Simulace platební brány
    const confirm = window.confirm(`Přejete si zakoupit ${PACKAGES.find(p => p.id === pkgId)?.name} za ${PACKAGES.find(p => p.id === pkgId)?.price}€? (Toto je simulace platby)`);
    if (!confirm) return;

    setIsPurchasing(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        avatarPackage: pkgId,
        avatarConfig: { clothes: 'tshirt', hair: 'none' } // reset to defaults of new package
      });
      setConfig({ clothes: 'tshirt', hair: 'none' });
      alert('Nákup byl úspěšný! Nyní si můžete upravit svého avatara.');
    } catch (error) {
      console.error('Chyba při nákupu:', error);
      alert('Nákup se nezdařil.');
    }
    setIsPurchasing(false);
  };

  const saveAvatar = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        avatarConfig: config
      });
      alert('Avatar byl úspěšně uložen!');
    } catch (error) {
      console.error('Chyba při ukládání:', error);
    }
    setIsSaving(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-zinc-950 min-h-full pb-20"
    >
      <div className="px-4 py-5 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-3 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-zinc-100">Můj Avatar</h1>
      </div>

      <div className="p-6">
        {currentPackage === 'none' ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">Starejte se o svého avatara</h2>
              <p className="text-zinc-400">Zakupte si jeden z balíčků a odemkněte si možnost přizpůsobit si vzhled svého avatara v aplikaci.</p>
            </div>

            {PACKAGES.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <div key={pkg.id} className={`border ${pkg.border} ${pkg.bg} rounded-xl p-5 relative overflow-hidden`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <Icon className={`w-6 h-6 ${pkg.color} mr-2`} />
                      <h3 className={`font-bold text-lg ${pkg.color}`}>{pkg.name}</h3>
                    </div>
                    <span className="text-xl font-bold text-zinc-100">{pkg.price} €</span>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-zinc-300">
                        <Check className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isPurchasing}
                    className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center transition-colors ${
                      pkg.id === 'premium' ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950' : 
                      pkg.id === 'extended' ? 'bg-purple-500 hover:bg-purple-400 text-white' : 
                      'bg-blue-500 hover:bg-blue-400 text-white'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Zakoupit balíček
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium mb-4">
                Aktivní: {PACKAGES.find(p => p.id === currentPackage)?.name}
              </span>
              <div className="flex justify-center">
                <AvatarDisplay config={config} size={192} />
              </div>
            </div>

            <div className="space-y-6 bg-zinc-900 p-5 rounded-xl border border-zinc-800">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Oblečení</label>
                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_ASSETS.clothes[currentPackage as keyof typeof AVATAR_ASSETS.clothes].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setConfig({ ...config, clothes: item.id })}
                      className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                        config.clothes === item.id 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }}></div>
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {currentPackage !== 'basic' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">Účes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVATAR_ASSETS.hair[currentPackage as keyof typeof AVATAR_ASSETS.hair].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setConfig({ ...config, hair: item.id })}
                        className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                          config.hair === item.id 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={saveAvatar}
                disabled={isSaving}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-colors mt-4"
              >
                {isSaving ? 'Ukládám...' : 'Uložit vzhled avatara'}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
