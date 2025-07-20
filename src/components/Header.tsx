import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  Cpu,
  LogOut,
  Settings,
  MessageCircle,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { userStorage, cartStorage, type User as UserType } from '@/lib/storage';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
  onSearch: (query: string) => void;
  cartItemCount: number;
}

export function Header({ onSearch, cartItemCount }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser: UserType | null = userStorage.getCurrentUser();
  const { t } = useLanguage();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleLogout = () => {
    userStorage.logout();
    cartStorage.clearCart();
    navigate('/');
    window.location.reload(); // Force refresh to update app state
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to={currentUser?.role === 'admin' ? '/admin' : '/'}
            className="flex items-center space-x-2 text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
          >
            <Cpu className="h-8 w-8 text-primary animate-glow-pulse" />
            <span>PC NEXUS</span>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center flex-1 max-w-md mx-8"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder={t('header.search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border focus:border-primary transition-colors"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme & Language */}
            <ThemeToggle />
            <LanguageToggle />

            {/* Only for non-admin users */}
            {currentUser?.role !== 'admin' && (
              <>
                {/* Notifications */}
                <NotificationBell />

                {/* Admin Chat */}
                <Link to="/profile?tab=messages">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:scale-105 transition-transform"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </Link>

                {/* AI Assistant */}
                <a
                  href="http://127.0.0.1:8080/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:scale-105 transition-transform"
                  >
                    <Bot className="h-5 w-5" />
                  </Button>
                </a>

                {/* Cart */}
                <Link to="/cart">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:scale-105 transition-transform"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs animate-scale-in"
                      >
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </>
            )}

            {/* User Menu */}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">{currentUser.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {currentUser.role === 'admin' ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        {t('header.admin_dashboard')}
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          {t('header.profile')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="cursor-pointer">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {t('header.orders')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('header.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">{t('header.login')}</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="glow">{t('header.signup')}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-4 animate-slide-in-right">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder={t('header.search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </form>

            {/* Mobile Navigation */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-center space-x-4 p-2">
                <ThemeToggle />
                <LanguageToggle />
              </div>

              {/* Messages */}
              {currentUser?.role !== 'admin' && (
                <Link
                  to="/profile?tab=messages"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{t('profile.messages')}</span>
                </Link>
              )}

              {/* AI Assistant */}
              {currentUser?.role !== 'admin' && (
                <a
                  href="http://127.0.0.1:56791/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Bot className="h-5 w-5" />
                  <span>AI Assistant</span>
                </a>
              )}

              {/* Cart */}
              {currentUser?.role !== 'admin' && (
                <Link
                  to="/cart"
                  className="flex items-center justify-between p-2 rounded-md hover:bg-secondary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>{t('header.cart')}</span>
                  </div>
                  {cartItemCount > 0 && <Badge variant="destructive">{cartItemCount}</Badge>}
                </Link>
              )}

              {/* Profile / Orders / Logout */}
              {currentUser ? (
                <>
                  {currentUser.role === 'admin' ? (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      <span>{t('header.admin_dashboard')}</span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span>{t('header.profile')}</span>
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <span>{t('header.orders')}</span>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary text-destructive text-left w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t('header.logout')}</span>
                  </button>
                </>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/login" className="flex-1">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('header.login')}
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1">
                    <Button
                      variant="glow"
                      className="w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('header.signup')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
