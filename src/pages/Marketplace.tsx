import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MessageSquare, Tag, Briefcase, ShoppingBag, Gift, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';

const AD_TYPES = [
  { id: 'sell', label: 'Prodám', icon: Tag, color: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'buy', label: 'Koupím', icon: ShoppingBag, color: 'bg-blue-500/20 text-blue-400' },
  { id: 'give', label: 'Daruji', icon: Gift, color: 'bg-yellow-500/20 text-yellow-400' },
  { id: 'service_offer', label: 'Nabízím službu', icon: Briefcase, color: 'bg-purple-500/20 text-purple-400' },
  { id: 'service_request', label: 'Hledám službu', icon: Search, color: 'bg-pink-500/20 text-pink-400' },
];

export default function Marketplace() {
  const [ads, setAds] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('sell');
  const [price, setPrice] = useState('');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !title.trim() || !description.trim()) return;

    await addDoc(collection(db, 'ads'), {
      authorId: user.uid,
      authorName: userProfile.displayName || 'Neznámý uživatel',
      title: title.trim(),
      description: description.trim(),
      type,
      price: price.trim(),
      createdAt: serverTimestamp()
    });

    setTitle('');
    setDescription('');
    setPrice('');
    setType('sell');
    setIsCreating(false);
  };

  const handleDelete = async (adId: string) => {
    if (window.confirm('Opravdu chcete smazat tento inzerát?')) {
      await deleteDoc(doc(db, 'ads', adId));
    }
  };

  const startChat = async (otherUserId: string) => {
    if (!user) return;
    if (otherUserId === user.uid) return;
    
    // Check if chat already exists
    const q1 = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const snapshot = await getDocs(q1);
    let existingChatId = null;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.participants.includes(otherUserId) && data.participants.length === 2) {
        existingChatId = doc.id;
      }
    });

    if (existingChatId) {
      navigate(`/chat/${existingChatId}`);
    } else {
      const newChatRef = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, otherUserId],
        lastMessage: '',
        lastMessageTime: serverTimestamp()
      });
      navigate(`/chat/${newChatRef.id}`);
    }
  };

  const getAdTypeConfig = (typeId: string) => {
    return AD_TYPES.find(t => t.id === typeId) || AD_TYPES[0];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-zinc-950 min-h-full pb-20"
    >
      <div className="px-4 py-5 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-zinc-100">Inzerce</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-zinc-900 p-4 border-b border-zinc-800 shadow-sm mb-4"
        >
          <h2 className="text-lg font-medium text-zinc-100 mb-4">Nový inzerát</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Typ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-zinc-700 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-zinc-800 text-zinc-100 border"
              >
                {AD_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Nadpis</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-zinc-700 rounded-md bg-zinc-800 text-zinc-100 border px-3 py-2 placeholder-zinc-500"
                placeholder="Např. Prodám kolo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Popis</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-zinc-700 rounded-md bg-zinc-800 text-zinc-100 border px-3 py-2 placeholder-zinc-500"
                placeholder="Detaily..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Cena (volitelné)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-zinc-700 rounded-md bg-zinc-800 text-zinc-100 border px-3 py-2 placeholder-zinc-500"
                placeholder="Např. 500 Kč, Zdarma, Dohodou"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="inline-flex justify-center py-2 px-4 border border-zinc-700 shadow-sm text-sm font-medium rounded-md text-zinc-300 bg-transparent hover:bg-zinc-800 focus:outline-none transition-colors"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none transition-colors"
              >
                Přidat
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="p-4 space-y-4">
        {ads.length === 0 && !isCreating && (
          <div className="text-center text-zinc-500 py-8">
            Zatím zde nejsou žádné inzeráty.
          </div>
        )}
        {ads.map((ad, index) => {
          const typeConfig = getAdTypeConfig(ad.type);
          const Icon = typeConfig.icon;
          const isMyAd = ad.authorId === user?.uid;

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={ad.id} 
              className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-800 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {typeConfig.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-start mt-1">
                      <h3 className="text-lg font-semibold text-zinc-100 leading-tight pr-4 break-words">{ad.title}</h3>
                      {ad.price && (
                        <span className="text-lg font-bold text-emerald-400 whitespace-nowrap flex-shrink-0">
                          {ad.price}
                        </span>
                      )}
                    </div>
                  </div>
                  {isMyAd && (
                    <button onClick={() => handleDelete(ad.id)} className="text-zinc-500 hover:text-red-500 p-1 ml-2 transition-colors flex-shrink-0">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-zinc-400 whitespace-pre-wrap">{ad.description}</p>
              </div>
              <div className="bg-zinc-950/50 px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-300">{ad.authorName}</span>
                  <span className="mx-1">•</span>
                  {ad.createdAt ? formatDistanceToNow(ad.createdAt.toDate(), { addSuffix: true }) : 'Právě teď'}
                </div>
                {!isMyAd && (
                  <button
                    onClick={() => startChat(ad.authorId)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Napsat
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
