import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Send, MapPin, Phone, Ban, Image as ImageIcon, BarChart2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import AvatarDisplay from '../components/AvatarDisplay';

export default function ChatRoom() {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBlockedByMe = userProfile?.blockedUsers?.includes(otherUser?.uid);
  const isBlockedByThem = otherUser?.blockedUsers?.includes(user?.uid);
  const isBlocked = isBlockedByMe || isBlockedByThem;

  useEffect(() => {
    if (!user || !chatId) return;

    // Fetch chat info to get other user
    const fetchChat = async () => {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        const participants = chatDoc.data().participants;
        const otherId = participants.find((p: string) => p !== user.uid);
        if (otherId) {
          // Listen to other user's document for real-time updates (like block status)
          const unsubscribeOtherUser = onSnapshot(doc(db, 'users', otherId), (docSnap) => {
            if (docSnap.exists()) {
              setOtherUser(docSnap.data());
            }
          });
          return unsubscribeOtherUser;
        }
      }
    };
    
    let unsubscribeOtherUser: any;
    fetchChat().then(unsub => {
      unsubscribeOtherUser = unsub;
    });

    // Listen to chat doc for typing status
    const unsubscribeChat = onSnapshot(doc(db, 'chats', chatId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const participants = data.participants;
        const otherId = participants.find((p: string) => p !== user.uid);
        if (data.typing && otherId && data.typing.includes(otherId)) {
          setIsOtherUserTyping(true);
        } else {
          setIsOtherUserTyping(false);
        }
      }
    });

    // Listen to messages
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeChat();
      if (unsubscribeOtherUser) unsubscribeOtherUser();
    };
  }, [chatId, user]);

  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!user || !chatId || isBlocked) return;

    // Add user to typing array
    await updateDoc(doc(db, 'chats', chatId), {
      typing: arrayUnion(user.uid)
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to remove user from typing array after 2 seconds
    typingTimeoutRef.current = setTimeout(async () => {
      await updateDoc(doc(db, 'chats', chatId), {
        typing: arrayRemove(user.uid)
      });
    }, 2000);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || !chatId || isBlocked) return;

    const text = newMessage.trim();
    setNewMessage('');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await addDoc(collection(db, `chats/${chatId}/messages`), {
      chatId,
      senderId: user.uid,
      text,
      type: 'text',
      timestamp: serverTimestamp()
    });

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      typing: arrayRemove(user.uid)
    });
  };

  const sendLocation = () => {
    if (!navigator.geolocation || !user || !chatId || isBlocked) return;
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        chatId,
        senderId: user.uid,
        text: 'Sdílí polohu',
        type: 'location',
        location: { lat: latitude, lng: longitude },
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: 'Sdílí polohu 📍',
        lastMessageTime: serverTimestamp()
      });
    }, (error) => {
      console.error("Error getting location", error);
      alert("Nepodařilo se získat polohu.");
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chatId || isBlocked) return;

    if (!file.type.startsWith('image/')) {
      alert('Prosím vyberte obrázek.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800; // max width/height for chat images
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
        
        try {
          await addDoc(collection(db, `chats/${chatId}/messages`), {
            chatId,
            senderId: user.uid,
            text: 'Odeslal(a) obrázek',
            type: 'image',
            imageUrl: base64String,
            timestamp: serverTimestamp()
          });

          await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: 'Obrázek 📷',
            lastMessageTime: serverTimestamp()
          });
        } catch (error) {
          console.error("Error sending image", error);
          alert("Nepodařilo se odeslat obrázek.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendPoll = async () => {
    if (!user || !chatId || isBlocked) return;
    const validOptions = pollOptions.filter(opt => opt.trim() !== '');
    if (!pollQuestion.trim() || validOptions.length < 2) {
      alert('Zadejte otázku a alespoň dvě možnosti.');
      return;
    }

    const pollData = {
      question: pollQuestion.trim(),
      options: validOptions.map(opt => ({ text: opt.trim(), votes: [] }))
    };

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        chatId,
        senderId: user.uid,
        text: 'Vytvořil(a) anketu',
        type: 'poll',
        poll: pollData,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: 'Anketa 📊',
        lastMessageTime: serverTimestamp()
      });

      setIsPollModalOpen(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (error) {
      console.error("Error sending poll", error);
      alert("Nepodařilo se vytvořit anketu.");
    }
  };

  const handleVote = async (messageId: string, optionIndex: number) => {
    if (!user || !chatId || isBlocked) return;
    
    const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const msgData = messageDoc.data();
      if (msgData.type === 'poll') {
        const updatedOptions = msgData.poll.options.map((opt: any, idx: number) => {
          // Remove user's vote from all options first
          const votesWithoutUser = opt.votes.filter((v: string) => v !== user.uid);
          // Add user's vote to the selected option
          if (idx === optionIndex) {
            return { ...opt, votes: [...votesWithoutUser, user.uid] };
          }
          return { ...opt, votes: votesWithoutUser };
        });

        await updateDoc(messageRef, {
          'poll.options': updatedOptions
        });
      }
    }
  };

  const startCall = async () => {
    if (!user || !chatId || isBlocked) return;
    alert("Funkce volání bude brzy dostupná!");
    
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      chatId,
      senderId: user.uid,
      text: '📞 Pokus o hovor',
      type: 'text',
      timestamp: serverTimestamp()
    });

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: '📞 Pokus o hovor',
      lastMessageTime: serverTimestamp()
    });
  };

  const toggleBlock = async () => {
    if (!user || !otherUser) return;
    
    const userRef = doc(db, 'users', user.uid);
    if (isBlockedByMe) {
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(otherUser.uid)
      });
    } else {
      if (window.confirm('Opravdu chcete tohoto uživatele zablokovat? Nebudete si moci posílat zprávy.')) {
        await updateDoc(userRef, {
          blockedUsers: arrayUnion(otherUser.uid)
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-zinc-950 text-zinc-100 relative">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          {otherUser && (
            <div className="flex items-center">
              {otherUser.avatarPackage && otherUser.avatarPackage !== 'none' && otherUser.avatarConfig ? (
                <div className="h-10 w-10 rounded-full ring-2 ring-zinc-800 mr-3 overflow-hidden bg-zinc-800 flex-shrink-0">
                  <AvatarDisplay config={otherUser.avatarConfig} size={40} />
                </div>
              ) : (
                <img 
                  className="h-10 w-10 rounded-full object-cover mr-3 ring-2 ring-zinc-800 flex-shrink-0" 
                  src={otherUser.photoURL || 'https://via.placeholder.com/150'} 
                  alt="" 
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <h2 className="text-lg font-medium text-zinc-100 leading-tight">{otherUser.displayName}</h2>
                <p className="text-xs text-zinc-400">
                  {otherUser.isOnline ? <span className="text-emerald-500">Online</span> : (otherUser.lastSeen ? `Naposledy: ${formatDistanceToNow(otherUser.lastSeen.toDate(), { addSuffix: true })}` : 'Offline')}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={startCall} className="text-emerald-500 hover:text-emerald-400 p-2 rounded-full hover:bg-zinc-800 disabled:opacity-50 transition-colors" disabled={isBlocked}>
            <Phone className="h-5 w-5" />
          </button>
          <button onClick={toggleBlock} className={`${isBlockedByMe ? 'text-red-500 hover:bg-red-500/10' : 'text-zinc-500 hover:text-red-500 hover:bg-red-500/10'} p-2 rounded-full transition-colors`} title={isBlockedByMe ? "Odblokovat" : "Zablokovat"}>
            <Ban className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-4 py-2 ${isMe ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-100'}`}>
                {msg.type === 'text' ? (
                  <p className="text-sm">{msg.text}</p>
                ) : msg.type === 'image' ? (
                  <div className="text-sm">
                    <img src={msg.imageUrl} alt="Obrázek" className="rounded-md max-w-full h-auto mt-1" />
                  </div>
                ) : msg.type === 'poll' ? (
                  <div className="text-sm w-full min-w-[200px]">
                    <div className="flex items-center mb-2 font-medium">
                      <BarChart2 className="h-4 w-4 mr-2" />
                      {msg.poll.question}
                    </div>
                    <div className="space-y-2 mt-2">
                      {msg.poll.options.map((opt: any, idx: number) => {
                        const totalVotes = msg.poll.options.reduce((acc: number, o: any) => acc + o.votes.length, 0);
                        const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                        const hasVoted = opt.votes.includes(user?.uid);
                        
                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleVote(msg.id, idx)}
                            className={`relative overflow-hidden rounded-md border p-2 cursor-pointer transition-colors ${hasVoted ? (isMe ? 'border-white bg-emerald-700' : 'border-emerald-500 bg-zinc-700') : (isMe ? 'border-emerald-400 hover:bg-emerald-500' : 'border-zinc-600 hover:bg-zinc-700')}`}
                          >
                            <div 
                              className={`absolute left-0 top-0 bottom-0 opacity-20 ${isMe ? 'bg-white' : 'bg-emerald-500'}`} 
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="relative flex justify-between items-center z-10">
                              <span>{opt.text}</span>
                              <span className="text-xs font-medium">{opt.votes.length} ({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="font-medium">Moje poloha</span>
                    </div>
                    {msg.location && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${msg.location.lat},${msg.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-xs opacity-90 hover:opacity-100"
                      >
                        Otevřít v mapách
                      </a>
                    )}
                  </div>
                )}
                {msg.timestamp && (
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-zinc-400'}`}>
                    {msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {isOtherUserTyping && !isBlocked && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-400 rounded-lg px-4 py-2 text-sm italic flex items-center space-x-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-zinc-900 px-4 py-3 border-t border-zinc-800">
        {isBlocked ? (
          <div className="text-center py-2 text-sm text-zinc-500">
            {isBlockedByMe ? "Zablokovali jste tohoto uživatele." : "Tento uživatel si nepřeje přijímat zprávy."}
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex space-x-2 items-center">
            <button
              type="button"
              onClick={sendLocation}
              className="inline-flex items-center justify-center p-2 rounded-full text-zinc-400 hover:bg-zinc-800 focus:outline-none transition-colors"
              title="Sdílet polohu"
            >
              <MapPin className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center p-2 rounded-full text-zinc-400 hover:bg-zinc-800 focus:outline-none transition-colors"
              title="Odeslat obrázek"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsPollModalOpen(true)}
              className="inline-flex items-center justify-center p-2 rounded-full text-zinc-400 hover:bg-zinc-800 focus:outline-none transition-colors"
              title="Vytvořit anketu"
            >
              <BarChart2 className="h-5 w-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Napište zprávu..."
              className="flex-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full rounded-full sm:text-sm border-zinc-700 px-4 py-2 bg-zinc-800 text-zinc-100 placeholder-zinc-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="inline-flex items-center justify-center p-2 rounded-full text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none disabled:opacity-50 transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>

      <AnimatePresence>
        {isPollModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-zinc-800 p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-zinc-100">Vytvořit anketu</h3>
                <button onClick={() => setIsPollModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Otázka</label>
                  <input 
                    type="text" 
                    value={pollQuestion}
                    onChange={e => setPollQuestion(e.target.value)}
                    placeholder="Na co se chcete zeptat?"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Možnosti</label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex mb-2">
                      <input 
                        type="text" 
                        value={opt}
                        onChange={e => {
                          const newOpts = [...pollOptions];
                          newOpts[idx] = e.target.value;
                          setPollOptions(newOpts);
                        }}
                        placeholder={`Možnost ${idx + 1}`}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                      {idx >= 2 && (
                        <button 
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="ml-2 p-2 text-red-500 hover:bg-red-500/10 rounded-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <button 
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-sm text-emerald-500 hover:text-emerald-400 mt-1"
                    >
                      + Přidat možnost
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={sendPoll}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-md transition-colors mt-4"
                >
                  Odeslat anketu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
