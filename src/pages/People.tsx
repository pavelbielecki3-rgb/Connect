import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, X, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import AvatarDisplay from '../components/AvatarDisplay';

export default function People() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => {
          if (u.id === user.uid) return false;
          const iAmBlocked = (u.blockedUsers || []).includes(user.uid);
          const iBlockedThem = (userProfile?.blockedUsers || []).includes(u.id);
          return !iAmBlocked && !iBlockedThem;
        });
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, [user, userProfile]);

  const startChat = async (otherUserId: string) => {
    if (!user) return;
    
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

  const filteredUsers = users.filter(u => {
    const queryLower = searchQuery.toLowerCase();
    const nameMatch = u.displayName?.toLowerCase().includes(queryLower);
    const interestsMatch = u.interests?.toLowerCase().includes(queryLower);
    const locationMatch = u.location && 'poloha'.includes(queryLower); // simple location keyword match
    return nameMatch || interestsMatch || locationMatch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-zinc-950 min-h-full pb-20 relative"
    >
      <div className="px-4 py-4 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100 mb-3">Lidé</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Hledat podle jména, zájmů..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md leading-5 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
          />
        </div>
      </div>

      <ul className="divide-y divide-zinc-800">
        {filteredUsers.map((u, index) => (
          <motion.li 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={u.id} 
            className="p-4 hover:bg-zinc-900 cursor-pointer transition-colors" 
            onClick={() => setSelectedUser(u)}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                {u.avatarPackage && u.avatarPackage !== 'none' && u.avatarConfig ? (
                  <div className="h-12 w-12 rounded-full ring-2 ring-zinc-800 overflow-hidden bg-zinc-800">
                    <AvatarDisplay config={u.avatarConfig} size={48} />
                  </div>
                ) : (
                  <img className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-800" src={u.photoURL || 'https://via.placeholder.com/150'} alt="" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {u.displayName}
                  </p>
                  {u.isOnline && (
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Online" />
                  )}
                </div>
                <p className="text-sm text-zinc-400 truncate">
                  {u.status || 'Dostupný'}
                </p>
                {!u.isOnline && u.lastSeen && (
                  <p className="text-xs text-zinc-500">
                    Naposledy viděn: {formatDistanceToNow(u.lastSeen.toDate(), { addSuffix: true })}
                  </p>
                )}
              </div>
              {u.location && (
                <div className="flex-shrink-0 text-emerald-500/50">
                  <MapPin className="h-5 w-5" />
                </div>
              )}
            </div>
          </motion.li>
        ))}
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            Nenalezeni žádní uživatelé.
          </div>
        )}
      </ul>

      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-zinc-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-32 bg-zinc-800">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="px-6 pb-6 relative">
                <div className="flex justify-between items-end -mt-12 mb-4">
                  {selectedUser.avatarPackage && selectedUser.avatarPackage !== 'none' && selectedUser.avatarConfig ? (
                    <div className="w-24 h-24 rounded-full border-4 border-zinc-900 overflow-hidden bg-zinc-800 relative z-10">
                      <AvatarDisplay config={selectedUser.avatarConfig} size={96} />
                    </div>
                  ) : (
                    <img 
                      src={selectedUser.photoURL || 'https://via.placeholder.com/150'} 
                      alt={selectedUser.displayName}
                      className="w-24 h-24 rounded-full border-4 border-zinc-900 object-cover bg-zinc-800 relative z-10"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <button
                    onClick={() => startChat(selectedUser.id)}
                    className="mb-2 flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-full transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Napsat zprávu
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                    {selectedUser.displayName}
                    {selectedUser.isOnline && (
                      <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Online" />
                    )}
                  </h2>
                  <p className="text-zinc-400 mt-1">{selectedUser.status || 'Dostupný'}</p>
                  {selectedUser.location && (
                    <p className="text-sm text-emerald-500/80 flex items-center mt-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      Sdílí polohu na mapě
                    </p>
                  )}
                </div>

                {selectedUser.interests && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Zájmy</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.interests.split(',').map((interest: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-sm border border-zinc-700">
                          {interest.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser.gallery && selectedUser.gallery.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Galerie</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedUser.gallery.map((img: string, idx: number) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-zinc-800">
                          <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
