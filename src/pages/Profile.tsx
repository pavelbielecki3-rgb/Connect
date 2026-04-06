import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { logOut } from '../firebase';
import { doc, updateDoc, deleteField, getDocs, query, collection, where, documentId, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { LogOut, MapPin, Check, Ban, Camera, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import AvatarDisplay from '../components/AvatarDisplay';

export default function Profile() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('other');
  const [interests, setInterests] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [blockedUsersList, setBlockedUsersList] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setStatus(userProfile.status || '');
      setGender(userProfile.gender || 'other');
      setInterests(userProfile.interests || '');
      setGallery(userProfile.gallery || []);
      setIsSharingLocation(!!userProfile.location);
      
      // Fetch blocked users details
      const fetchBlockedUsers = async () => {
        if (userProfile.blockedUsers && userProfile.blockedUsers.length > 0) {
          try {
            const chunks = [];
            for (let i = 0; i < userProfile.blockedUsers.length; i += 10) {
              chunks.push(userProfile.blockedUsers.slice(i, i + 10));
            }
            
            let allBlocked: any[] = [];
            for (const chunk of chunks) {
              const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
              const snap = await getDocs(q);
              allBlocked = [...allBlocked, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
            }
            setBlockedUsersList(allBlocked);
          } catch (error) {
            console.error("Error fetching blocked users", error);
          }
        } else {
          setBlockedUsersList([]);
        }
      };
      
      fetchBlockedUsers();
    }
  }, [userProfile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Prosím vyberte obrázek.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const base64String = canvas.toDataURL('image/jpeg', 0.7);
        
        if (!user) return;
        setIsSaving(true);
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            photoURL: base64String
          });
        } catch (error) {
          console.error("Error updating profile picture", error);
          alert("Nepodařilo se nahrát fotku. Možná je příliš velká.");
        }
        setIsSaving(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Prosím vyberte obrázek.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // slightly larger for gallery
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const base64String = canvas.toDataURL('image/jpeg', 0.7);
        
        if (!user) return;
        setIsSaving(true);
        try {
          const newGallery = [...gallery, base64String];
          await updateDoc(doc(db, 'users', user.uid), {
            gallery: newGallery
          });
          setGallery(newGallery);
        } catch (error) {
          console.error("Error updating gallery", error);
          alert("Nepodařilo se nahrát fotku do galerie. Možná je příliš velká.");
        }
        setIsSaving(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeGalleryImage = async (index: number) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const newGallery = gallery.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'users', user.uid), {
        gallery: newGallery
      });
      setGallery(newGallery);
    } catch (error) {
      console.error("Error removing gallery image", error);
    }
    setIsSaving(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: status,
        gender: gender,
        interests: interests
      });
    } catch (error) {
      console.error("Error updating profile", error);
    }
    setIsSaving(false);
  };

  const toggleLocation = async () => {
    if (!user) return;
    
    if (isSharingLocation) {
      // Stop sharing
      await updateDoc(doc(db, 'users', user.uid), {
        location: deleteField()
      });
      setIsSharingLocation(false);
    } else {
      // Start sharing
      if (!navigator.geolocation) {
        alert("Geolokace není podporována vaším prohlížečem.");
        return;
      }
      
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await updateDoc(doc(db, 'users', user.uid), {
          location: { lat: latitude, lng: longitude }
        });
        setIsSharingLocation(true);
      }, (error) => {
        console.error("Error getting location", error);
        alert("Nepodařilo se získat polohu. Zkontrolujte oprávnění.");
      });
    }
  };

  const unblockUser = async (blockedUserId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        blockedUsers: arrayRemove(blockedUserId)
      });
    } catch (error) {
      console.error("Error unblocking user", error);
    }
  };

  if (!userProfile) return <div className="p-8 text-center text-zinc-500">Načítání...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-zinc-950 min-h-full pb-20"
    >
      <div className="px-4 py-5 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100">Můj Profil</h1>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col items-center relative">
          <div 
            className="relative group cursor-pointer" 
            onClick={() => fileInputRef.current?.click()}
            title="Změnit profilovou fotku"
          >
            {userProfile.avatarPackage && userProfile.avatarPackage !== 'none' && userProfile.avatarConfig ? (
              <div className="border-4 border-zinc-800 rounded-full group-hover:opacity-75 transition-opacity">
                <AvatarDisplay config={userProfile.avatarConfig} size={96} />
              </div>
            ) : (
              <img 
                className="h-24 w-24 rounded-full object-cover border-4 border-zinc-800 group-hover:opacity-75 transition-opacity" 
                src={userProfile.photoURL || 'https://via.placeholder.com/150'} 
                alt="Profile" 
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full">
              <Camera className="h-8 w-8 text-white drop-shadow-md" />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <h2 className="mt-4 text-2xl font-bold text-zinc-100">{userProfile.displayName}</h2>
          <p className="text-sm text-zinc-400">{userProfile.email}</p>
          
          <button
            onClick={() => navigate('/avatar')}
            className="mt-4 flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full hover:bg-emerald-500/20 transition-colors text-sm font-medium"
          >
            <UserCircle className="w-4 h-4 mr-2" />
            Upravit Avatara
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-zinc-300">
                Aktuální status
              </label>
              <input
                type="text"
                name="status"
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-zinc-700 rounded-md bg-zinc-800 text-zinc-100 border px-3 py-2 placeholder-zinc-500"
                placeholder="Co se děje?"
              />
            </div>
            
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-zinc-300">
                Pohlaví (pro ikonu na mapě)
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-zinc-700 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-zinc-800 text-zinc-100 border"
              >
                <option value="other">Neurčeno / Jiné</option>
                <option value="male">Muž</option>
                <option value="female">Žena</option>
              </select>
            </div>

            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-zinc-300">
                Zájmy (oddělené čárkou)
              </label>
              <input
                type="text"
                name="interests"
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-zinc-700 rounded-md bg-zinc-800 text-zinc-100 border px-3 py-2 placeholder-zinc-500"
                placeholder="např. sport, hudba, cestování"
              />
            </div>

            <button
              type="button"
              onClick={saveProfile}
              disabled={isSaving || (status === (userProfile.status || '') && gender === (userProfile.gender || 'other') && interests === (userProfile.interests || ''))}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Ukládám...' : 'Uložit změny'}
            </button>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-100 mb-3">Moje Galerie</h3>
            <div className="grid grid-cols-3 gap-2">
              {gallery.map((img, idx) => (
                <div key={idx} className="relative group aspect-square">
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover rounded-md border border-zinc-700" />
                  <button 
                    onClick={() => removeGalleryImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Smazat fotku"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {gallery.length < 6 && (
                <div 
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-md cursor-pointer hover:border-emerald-500 hover:bg-zinc-800 transition-colors"
                >
                  <Camera className="w-6 h-6 text-zinc-500" />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={galleryInputRef} 
              onChange={handleGalleryUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <p className="text-xs text-zinc-500 mt-2">Můžete nahrát až 6 fotek.</p>
          </div>

          <div className="flex items-center justify-between py-4 border-t border-b border-zinc-800">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-zinc-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-zinc-100">Sdílet polohu na profilu</p>
                <p className="text-xs text-zinc-400">Ostatní uvidí vaši polohu v seznamu lidí</p>
              </div>
            </div>
            <button
              onClick={toggleLocation}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${isSharingLocation ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isSharingLocation ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {blockedUsersList.length > 0 && (
            <div className="py-2">
              <h3 className="text-sm font-medium text-zinc-100 mb-3 flex items-center">
                <Ban className="h-4 w-4 mr-2 text-red-500" />
                Zablokovaní uživatelé
              </h3>
              <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-md">
                {blockedUsersList.map(blockedUser => (
                  <li key={blockedUser.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center">
                      <img src={blockedUser.photoURL || 'https://via.placeholder.com/150'} alt="" className="h-8 w-8 rounded-full mr-3 ring-1 ring-zinc-700" referrerPolicy="no-referrer" />
                      <span className="text-sm font-medium text-zinc-100">{blockedUser.displayName}</span>
                    </div>
                    <button
                      onClick={() => unblockUser(blockedUser.id)}
                      className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                    >
                      Odblokovat
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="py-4 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-100 mb-3">O aplikaci</h3>
            <div className="space-y-2">
              <a href="/terms" className="block text-sm text-emerald-500 hover:text-emerald-400 hover:underline">
                Podmínky použití
              </a>
              <a href="/privacy" className="block text-sm text-emerald-500 hover:text-emerald-400 hover:underline">
                Zásady ochrany osobních údajů
              </a>
            </div>
          </div>

          <button
            onClick={logOut}
            className="w-full flex justify-center items-center py-2 px-4 border border-zinc-800 rounded-md shadow-sm text-sm font-medium text-red-500 bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Odhlásit se
          </button>
        </div>
      </div>
    </motion.div>
  );
}
