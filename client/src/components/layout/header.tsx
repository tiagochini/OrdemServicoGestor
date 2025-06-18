import { useState } from "react";
import { Menu, LogOut, User } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "@/components/NotificationCenter";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;
    
    // Navigate to orders page with search query
    navigate(`/orders?search=${encodeURIComponent(searchQuery.trim())}`);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return "US";
    return user.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="w-full">
      <div className="relative z-10 flex-shrink-0 h-16 bg-white shadow flex px-4">
        <button 
          type="button" 
          className="lg:hidden px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          onClick={onMenuClick}
        >
          <span className="sr-only">Abrir menu</span>
          <Menu className="h-6 w-6" />
        </button>
          
        <div className="flex-1 flex justify-between px-4 md:px-0">
          <div className="flex-1 flex items-center">
            <form className="w-full max-w-xl relative" onSubmit={handleSearch}>
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <Input
                id="search"
                name="search"
                className="block w-full bg-gray-100 border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-primary focus:ring-primary"
                placeholder="Buscar ordens de serviço..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          
          <div className="ml-4 flex items-center md:ml-6">
            <NotificationCenter />
  
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="ml-3 max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  id="user-menu-button"
                >
                  <span className="sr-only">Abrir menu de usuário</span>
                  <Avatar>
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name || 'Usuário'}</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs text-gray-500">{user?.email || 'Sem email'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
