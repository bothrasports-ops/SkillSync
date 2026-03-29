
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, ChatRoom } from '../types';
import { db, supabase } from '../services/db';

interface ChatProps {
  currentUser: User;
  users: User[];
  allMessages: Message[];
  onSendMessage: (receiverId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onDeleteChat: (userId: string) => void;
  initialRecipientId?: string | null;
}

const Chat: React.FC<ChatProps> = ({
  currentUser,
  users,
  allMessages,
  onSendMessage,
  onDeleteMessage,
  onDeleteChat,
  initialRecipientId
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showChatMenu, setShowChatMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialRecipientId) {
      const user = users.find(u => u.id === initialRecipientId);
      if (user) setSelectedUser(user);
    }
  }, [initialRecipientId, users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedUser]);

  const chatRooms: ChatRoom[] = users
    .filter(u => u.id !== currentUser.id)
    .map(user => {
      const roomMessages = allMessages.filter(m =>
        (m.senderId === currentUser.id && m.receiverId === user.id) ||
        (m.senderId === user.id && m.receiverId === currentUser.id)
      );
      const lastMessage = roomMessages[roomMessages.length - 1];
      const unreadCount = roomMessages.filter(m => m.receiverId === currentUser.id && !m.read).length;

      return {
        id: user.id,
        participants: [user],
        lastMessage,
        unreadCount
      };
    })
    .filter(room => room.lastMessage) // Only show users we have a history with
    .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));

  const activeMessages = selectedUser
    ? allMessages.filter(m =>
        (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
        (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
      )
    : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !messageText.trim()) return;
    onSendMessage(selectedUser.id, messageText.trim());
    setMessageText('');
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800">Messages</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatRooms.length > 0 ? chatRooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedUser(room.participants[0])}
              className={`w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-all border-b border-slate-50 ${selectedUser?.id === room.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : ''}`}
            >
              <div className="relative">
                <img src={room.participants[0].avatar} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                {room.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {room.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-black text-sm text-slate-800 truncate">{room.participants[0].name}</h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {room.lastMessage ? new Date(room.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate font-medium">
                  {room.lastMessage?.senderId === currentUser.id ? 'You: ' : ''}
                  {room.lastMessage?.text}
                </p>
              </div>
            </button>
          )) : (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                <i className="fa-solid fa-comments text-2xl"></i>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No active chats</p>
              <p className="text-slate-400 text-[10px] font-medium leading-relaxed">Connect with someone from the home screen to start a conversation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main: Active Chat */}
      <div className={`flex-1 flex flex-col bg-slate-50/30 ${!selectedUser ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <img src={selectedUser.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h4 className="font-black text-slate-800">{selectedUser.name}</h4>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Online Community Member</p>
                </div>
              </div>
              <div className="flex gap-2 relative">
                <button className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                  <i className="fa-solid fa-phone text-xs"></i>
                </button>
                <button
                  onClick={() => setShowChatMenu(!showChatMenu)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showChatMenu ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                >
                  <i className="fa-solid fa-ellipsis-vertical text-xs"></i>
                </button>

                {showChatMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                    <button
                      onClick={() => {
                        onDeleteChat(selectedUser.id);
                        setShowChatMenu(false);
                        setSelectedUser(null);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                      Delete Chat
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeMessages.length > 0 ? activeMessages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                const showDate = idx === 0 || new Date(msg.timestamp).toDateString() !== new Date(activeMessages[idx-1].timestamp).toDateString();

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-6">
                        <span className="px-4 py-1 bg-slate-100 text-slate-400 text-[9px] font-black rounded-full uppercase tracking-widest">
                          {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    <div className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`relative max-w-[80%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                        <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                        <div className="flex items-center justify-between mt-2 gap-4">
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <button
                              onClick={() => onDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-300 hover:text-white"
                            >
                              <i className="fa-solid fa-trash-can text-[10px]"></i>
                            </button>
                          )}
                          {!isMe && (
                            <button
                              onClick={() => onDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500"
                            >
                              <i className="fa-solid fa-trash-can text-[10px]"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-hand-wave text-2xl text-slate-400"></i>
                  </div>
                  <div>
                    <p className="font-black text-slate-500 uppercase text-[10px] tracking-widest">No messages yet</p>
                    <p className="text-xs font-medium text-slate-400">Say hello to start the conversation!</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="flex gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full pl-6 pr-14 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors">
                    <i className="fa-solid fa-face-smile text-lg"></i>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 max-w-xs">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <i className="fa-solid fa-paper-plane text-3xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">Your Inbox</h3>
              <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">Select a conversation to start chatting with other community members.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
