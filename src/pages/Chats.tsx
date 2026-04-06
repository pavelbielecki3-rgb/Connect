import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, orderBy, getDocs, documentId } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import AvatarDisplay from '../components/AvatarDisplay';

export default function Chats() {
  const [chats, setChats] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch user details for participants
      const otherUserIds = new Set<string>();
      chatsData.forEach((chat: any) => {
        chat.participants.forEach((p: string) => {
          if (p !== user.uid) otherUserIds.add(p);
        });
      });

      let newUsersMap: Record<string, any> = {};
      if (otherUserIds.size > 0) {
        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', Array.from(otherUserIds)));
        const usersSnap = await getDocs(usersQuery);
        usersSnap.forEach(doc => {
          newUsersMap[doc.id] = doc.data();
        });
        setUsersMap(prev => ({ ...prev, ...newUsersMap }));
      }

      // Filter out chats with blocked users
      const filteredChats = chatsData.filter((chat: any) => {
        const otherUserId = chat.participants.find((p: string) => p !== user.uid);
        if (!otherUserId) return false;
        
        // If we haven't loaded the user yet, keep the chat for now
        // It will re-render and filter once usersMap is updated
        const otherUser = newUsersMap[otherUserId] || usersMap[otherUserId];
        if (!otherUser) return true;

        const iAmBlocked = (otherUser.blockedUsers || []).includes(user.uid);
        const iBlockedThem = (userProfile?.blockedUsers || []).includes(otherUserId);
        return !iAmBlocked && !iBlockedThem;
      });

      setChats(filteredChats);
    });

    return () => unsubscribe();
  }, [user, userProfile, usersMap]); // Added usersMap to dependency array to re-filter when it updates

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-zinc-950 min-h-full pb-20"
    >
      <div className="px-4 py-5 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100">Chaty</h1>
      </div>
      <ul className="divide-y divide-zinc-800">
        {chats.map((chat, index) => {
          const otherUserId = chat.participants.find((p: string) => p !== user?.uid);
          const otherUser = otherUserId ? usersMap[otherUserId] : null;

          return (
            <motion.li 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={chat.id} 
              className="p-4 hover:bg-zinc-900 cursor-pointer transition-colors" 
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <div className="flex items-center space-x-4">
                {otherUser?.avatarPackage && otherUser?.avatarPackage !== 'none' && otherUser?.avatarConfig ? (
                  <div className="h-12 w-12 rounded-full ring-2 ring-zinc-800 overflow-hidden bg-zinc-800 flex-shrink-0">
                    <AvatarDisplay config={otherUser.avatarConfig} size={48} />
                  </div>
                ) : (
                  <img 
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-800 flex-shrink-0" 
                    src={otherUser?.photoURL || 'https://via.placeholder.com/150'} 
                    alt="" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 overflow-hidden pr-2">
                      <p className="text-sm font-medium text-zinc-100 truncate flex-shrink-0">
                        {otherUser?.displayName || 'Neznámý uživatel'}
                      </p>
                      <span className="text-zinc-600 text-xs flex-shrink-0">•</span>
                      <p className="text-sm text-zinc-400 truncate">
                        {chat.lastMessage ? chat.lastMessage.split(' ').slice(0, 5).join(' ') + (chat.lastMessage.split(' ').length > 5 ? '...' : '') : 'Zatím žádné zprávy'}
                      </p>
                    </div>
                    {chat.lastMessageTime && (
                      <p className="text-xs text-zinc-500 flex-shrink-0">
                        {formatDistanceToNow(chat.lastMessageTime.toDate(), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
        {chats.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            Zatím nemáte žádné chaty.
          </div>
        )}
      </ul>
    </motion.div>
  );
}
