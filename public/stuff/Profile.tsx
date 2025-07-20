import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { userStorage, messageStorage } from '@/lib/storage';
import { Header } from '@/components/Header';
import { Camera, Save, User, MessageCircle, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { User as UserType, Message } from '@/lib/storage';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [adminId, setAdminId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', image: '' });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Choose default tab from query string
  const params = new URLSearchParams(location.search);
  const defaultTab = params.get('tab') === 'messages' ? 'messages' : 'profile';

  useEffect(() => {
    const currentUser = userStorage.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Set up user profile state
    setUser(currentUser);
    setFormData({
      name: currentUser.name,
      email: currentUser.email,
      image: currentUser.image || '',
    });
    setImagePreview(currentUser.image || '');

    // Dynamically find the admin user ID
    const allUsers = userStorage.getUsers();
    const adminUser = allUsers.find(u => u.role === 'admin');
    const id = adminUser?.id || '';
    setAdminId(id);

    // Load conversation with admin
    if (id) {
      const convo = messageStorage.getConversation(currentUser.id, id);
      setMessages(convo);
    }
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setFormData(prev => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Persist updated user info
    const users = userStorage.getUsers();
    const updatedList = users.map(u =>
      u.id === user.id ? { ...u, ...formData } : u
    );
    userStorage.saveUsers(updatedList);

    const updatedUser = { ...user, ...formData };
    userStorage.setCurrentUser(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);

    toast({
      title: t('common.success'),
      description: t('profile.update_success'),
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !adminId) return;

    // Send & append new message
    const sent = messageStorage.sendMessage(user.id, adminId, newMessage);
    setMessages(prev => [...prev, sent]);
    setNewMessage('');

    toast({
      title: t('common.success'),
      description: t('profile.message_sent_to_admin'),
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={() => {}} cartItemCount={0} />

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
            {t('profile.user_profile')}
          </h1>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 sm:h-12">
              <TabsTrigger value="profile" className="text-sm sm:text-base">
                {t('profile.title').split(' & ')[0]}
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-sm sm:text-base">
                {t('profile.messages')}
              </TabsTrigger>
            </TabsList>

            {/* ─── Profile Tab ──────────────────────────────────────────── */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('profile.profile_information')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative flex-shrink-0">
                          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Profile"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <label
                            htmlFor="profile-image"
                            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90"
                          >
                            <Camera className="h-4 w-4" />
                            <input
                              id="profile-image"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="flex-1 w-full space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">{t('auth.name')}</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, name: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">{t('auth.email')}</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, email: e.target.value }))
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          {t('common.save')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              name: user.name,
                              email: user.email,
                              image: user.image || '',
                            });
                            setImagePreview(user.image || '');
                          }}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h2 className="text-xl sm:text-2xl font-bold">{user.name}</h2>
                          <p className="text-muted-foreground text-sm sm:text-base">
                            {user.email}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                            {t('admin.role')}: {t(`admin.${user.role}`)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('profile.member_since')}: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Button onClick={() => setIsEditing(true)}>
                        {t('profile.edit_profile')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Messages Tab ──────────────────────────────────────────── */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {t('profile.messages_with_admin')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-64 sm:h-96 overflow-y-auto border rounded-lg p-3 sm:p-4 space-y-3 bg-muted/20">
                      {messages.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          {t('profile.no_messages')}
                        </p>
                      ) : (
                        messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.fromUserId === user.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                                msg.fromUserId === user.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-card border'
                              }`}
                            >
                              <p className="text-xs sm:text-sm break-words">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-2">
                      <Textarea
                        placeholder={t('profile.type_message')}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        className="min-h-[60px] flex-1"
                        required
                      />
                      <Button type="submit" size="sm" className="sm:mt-auto w-full sm:w-auto sm:px-3">
                        <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-0" />
                        <span className="sm:hidden">Send</span>
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
