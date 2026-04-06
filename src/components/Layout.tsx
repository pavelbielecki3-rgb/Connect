import { Outlet, NavLink } from 'react-router-dom';
import { Users, MessageSquare, UserCircle, ShoppingBag, Map as MapIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      
      <nav className="bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-md mx-auto px-1 flex justify-between">
          <NavLink
            to="/people"
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-2 flex-1 transition-colors ${
                isActive ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                <Users className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">Lidé</span>
              </motion.div>
            )}
          </NavLink>
          
          <NavLink
            to="/chats"
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-2 flex-1 transition-colors ${
                isActive ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                <MessageSquare className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">Chaty</span>
              </motion.div>
            )}
          </NavLink>

          <NavLink
            to="/marketplace"
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-2 flex-1 transition-colors ${
                isActive ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                <ShoppingBag className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">Inzerce</span>
              </motion.div>
            )}
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-2 flex-1 transition-colors ${
                isActive ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                <MapIcon className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">Mapa</span>
              </motion.div>
            )}
          </NavLink>
          
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-2 flex-1 transition-colors ${
                isActive ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                <UserCircle className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">Profil</span>
              </motion.div>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
