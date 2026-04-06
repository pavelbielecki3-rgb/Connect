import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MessageSquare } from 'lucide-react';
import { getAvatarHtml } from '../components/AvatarDisplay';

export default function MapPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Fetch users
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => {
          if (u.id === user.uid) return false;
          const iAmBlocked = (u.blockedUsers || []).includes(user.uid);
          const iBlockedThem = (userProfile?.blockedUsers || []).includes(u.id);
          return !iAmBlocked && !iBlockedThem && u.location;
        });
      
      // Add current user if they have location
      if (userProfile?.location) {
         usersData.push({ id: user.uid, ...userProfile, isMe: true });
      }
      setUsers(usersData);
    });

    // Fetch ads
    const qAds = query(collection(db, 'ads'));
    const unsubAds = onSnapshot(qAds, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubAds();
    };
  }, [user, userProfile]);

  const startChat = async (otherUserId: string) => {
    if (!user || otherUserId === user.uid) return;
    const chatId1 = `${user.uid}_${otherUserId}`;
    const chatId2 = `${otherUserId}_${user.uid}`;
    const chatDoc1 = await getDoc(doc(db, 'chats', chatId1));
    const chatDoc2 = await getDoc(doc(db, 'chats', chatId2));
    let finalChatId = chatId1;
    if (chatDoc1.exists()) finalChatId = chatId1;
    else if (chatDoc2.exists()) finalChatId = chatId2;
    else {
      await setDoc(doc(db, 'chats', finalChatId), {
        participants: [user.uid, otherUserId],
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: serverTimestamp()
      });
    }
    navigate(`/chat/${finalChatId}`);
  };

  const createCustomIcon = (user: any) => {
    const isOnline = !!user.isOnline;
    const gender = user.gender || 'other';
    
    let svgContent = '';
    
    if (user.avatarPackage && user.avatarPackage !== 'none' && user.avatarConfig) {
      svgContent = getAvatarHtml(user.avatarConfig, 44);
    } else {
      let color = '';
      if (gender === 'male') {
        color = '#3b82f6'; // blue-500
        svgContent = `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.6)); color: ${color};"><circle cx="12" cy="4" r="2.5" /><path d="M14 8H10c-1.1 0-2 .9-2 2v5h2v6h4v-6h2v-5c0-1.1-.9-2-2-2z" /></svg>`;
      } else if (gender === 'female') {
        color = '#ec4899'; // pink-500
        svgContent = `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.6)); color: ${color};"><circle cx="12" cy="4" r="2.5" /><path d="M12 7.5L8 16H10.5V21H13.5V16H16L12 7.5Z" /></svg>`;
      } else {
        color = '#a855f7'; // purple-500
        svgContent = `<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.6)); color: ${color};"><circle cx="12" cy="4" r="2.5" /><path d="M14 8H10c-1.1 0-2 .9-2 2v5h2v6h4v-6h2v-5c0-1.1-.9-2-2-2z" /></svg>`;
      }
    }

    const statusColor = isOnline ? '#10b981' : '#52525b'; // emerald-500 : zinc-600
    const statusBorder = '#ffffff'; // white border for light map

    return L.divIcon({
      className: 'custom-avatar-icon',
      html: `<div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
              ${svgContent}
              <div style="position: absolute; bottom: 0px; right: 0px; width: 14px; height: 14px; background-color: ${statusColor}; border: 2.5px solid ${statusBorder}; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.3); transition: background-color 0.3s ease;"></div>
             </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22]
    });
  };

  // Default center (e.g., Prague) or user's location
  const center = userProfile?.location ? [userProfile.location.lat, userProfile.location.lng] : [49.8, 15.5];

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative pb-16">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 z-10 relative shadow-sm">
        <h1 className="text-xl font-bold text-zinc-100">Mapa uživatelů</h1>
      </div>
      <div className="flex-1 relative z-0">
        <MapContainer center={center as any} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {users.map(u => {
            const userAds = ads.filter(ad => ad.authorId === u.id);
            return (
              <Marker 
                key={u.id} 
                position={[u.location.lat, u.location.lng]}
                icon={createCustomIcon(u)}
              >
                <Popup className="dark-popup">
                  <div className="text-center min-w-[150px] bg-zinc-900 text-zinc-100 p-2 rounded-lg -m-3">
                    <h3 className="font-bold text-sm text-emerald-400">{u.displayName} {u.isMe && '(Vy)'}</h3>
                    {u.status && <p className="text-xs text-zinc-400 italic mt-1">"{u.status}"</p>}
                    
                    {userAds.length > 0 && (
                      <div className="mt-2 text-left">
                        <p className="text-xs font-semibold text-zinc-300 border-b border-zinc-700 pb-1 mb-1">Inzeráty:</p>
                        <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                          {userAds.map(ad => (
                            <li key={ad.id} className="truncate text-zinc-300">
                              <span className="font-medium text-emerald-500">[{ad.type}]</span> {ad.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {!u.isMe && (
                      <button 
                        onClick={() => startChat(u.id)}
                        className="mt-3 w-full flex items-center justify-center px-3 py-1.5 bg-emerald-600 text-zinc-950 text-xs font-medium rounded hover:bg-emerald-500 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Napsat zprávu
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
