import React, { useState } from 'react';
import { signInWithGoogle, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { MessageCircle } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (!displayName.trim()) {
          throw new Error('Prosím zadejte své jméno.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await sendEmailVerification(user);
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName: displayName,
          email: user.email || '',
          photoURL: '',
          status: 'Available',
          isOnline: true,
          lastSeen: serverTimestamp()
        });

        setMessage('Registrace úspěšná! Zkontrolujte svůj e-mail pro ověření adresy.');
        setIsRegistering(false);
        setPassword('');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update presence only if verified, otherwise ProtectedRoute handles it
        if (user.emailVerified) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            await updateDoc(userRef, {
              isOnline: true,
              lastSeen: serverTimestamp()
            });
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Tento e-mail je již zaregistrován.');
      } else if (err.code === 'auth/weak-password') {
        setError('Heslo musí mít alespoň 6 znaků.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Neplatný e-mail nebo heslo.');
      } else {
        setError(err.message || 'Došlo k chybě při přihlašování.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError('Přihlášení přes Google selhalo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-zinc-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-emerald-500 p-3 rounded-full shadow-lg shadow-emerald-500/20">
            <MessageCircle className="h-10 w-10 text-zinc-950" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-100">
          ConnectChat
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          {isRegistering ? 'Vytvořte si nový účet' : 'Přihlaste se ke svému účtu'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-zinc-800">
          
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-md text-sm">
              {message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleEmailAuth}>
            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                  Jméno
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md shadow-sm placeholder-zinc-500 text-zinc-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                E-mailová adresa
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md shadow-sm placeholder-zinc-500 text-zinc-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Heslo
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md shadow-sm placeholder-zinc-500 text-zinc-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Zpracovávám...' : (isRegistering ? 'Zaregistrovat se' : 'Přihlásit se')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-900 text-zinc-500">Nebo pokračujte přes</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50 transition-colors"
              >
                <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
                Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setMessage('');
              }}
              className="text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
            >
              {isRegistering ? 'Již máte účet? Přihlaste se' : 'Nemáte účet? Zaregistrujte se'}
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-zinc-500">
            Přihlášením nebo registrací souhlasíte s našimi{' '}
            <a href="/terms" className="text-emerald-500 hover:underline">Podmínkami použití</a>
            {' '}a{' '}
            <a href="/privacy" className="text-emerald-500 hover:underline">Zásadami ochrany osobních údajů</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
