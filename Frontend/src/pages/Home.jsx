// Home.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "../Styles/home.css";
import axios from "axios";
import { io } from "socket.io-client";

function formatPreview(messages) {
  if (!messages || messages.length === 0) return "New chat";
  const firstUser = messages.find((m) => m.role === "user");
  const preview = firstUser ? firstUser.content : messages[0].content;
  return preview.length > 36 ? preview.slice(0, 36) + "…" : preview;
}

export default function Home() {
  // ----- helpers: localStorage safe wrapper -----
  function lsGet(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('lsGet parse error', key, e);
      return fallback;
    }
  }
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('lsSet error', key, e);
    }
  }
  // ----- state -----
  const [chats, setChats] = useState(() => lsGet("cgpt_chats_v3", []));
  const [activeChatId, setActiveChatId] = useState(() => lsGet("cgpt_active_v3", null));

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [renameModal, setRenameModal] = useState({ open: false, chatId: null, value: "" });
  const [busy, setBusy] = useState(false);
  const [userName, setUserName] = useState(null);
  // auto-speak feature removed
  const [toast, setToast] = useState({ show: false, msg: "" });
  
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [leftUserMenuOpen, setLeftUserMenuOpen] = useState(false);
  const leftUserRef = useRef(null);

  const chatBoxRef = useRef(null);
  const createdChatRef = useRef(false);
  const chatsRef = useRef();
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  const preSpeechRef = useRef("");
  const composerRef = useRef(null);
  const [openMsgId, setOpenMsgId] = useState(null);
  const socketRef = useRef(null);

  // ----- derived -----
  const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId) || null, [chats, activeChatId]);
  const messages = useMemo(() => activeChat?.messages ?? [], [activeChat]);

  // keep a ref copy of chats so streaming helpers can inspect current state without stale closures
  useEffect(() => { chatsRef.current = chats; }, [chats]);
const fetchChats = useCallback(async () => {
  try {
    const res = await axios.get("http://localhost:3000/api/chat", {
      withCredentials: true
    });

    if (res.data && res.data.chats) {
      // Normalize chats coming from backend so the UI always gets the shape it expects
      const norm = (res.data.chats || []).map((c) => {
        // backend returns lastMessage for preview instead of full messages array
        const lastMessage = c.lastMessage || "";
        // keep messages array empty unless backend supplies it
        let msgs = [];
        try {
          if (Array.isArray(c.messages)) msgs = c.messages;
          else if (typeof c.messages === 'string') msgs = JSON.parse(c.messages || '[]');
        } catch (e) {
          console.warn('Failed to parse chat.messages for chat', c.id, e);
          msgs = [];
        }
        return {
          id: String(c.id || c._id || Date.now().toString() + Math.random().toString(36).slice(2, 7)),
          title: c.title || 'New chat',
          createdAt: c.createdAt ? Number(new Date(c.createdAt)) : (c.createdAt === 0 ? 0 : (c.createdAt || Date.now())),
          lastActivity: c.lastActivity || c.updatedAt || null,
          lastMessage: lastMessage,
          messages: msgs,
          pinned: !!c.pinned,
        };
      });
      setChats(norm);

      // ensure an active chat is selected (validate persisted id or pick the first)
      const persisted = lsGet('cgpt_active_v3', null) || activeChatId;
      if (!persisted && norm.length) {
        setActiveChatId(norm[0].id);
      } else if (persisted) {
        const exists = norm.some((x) => String(x.id) === String(persisted));
        if (!exists && norm.length) setActiveChatId(norm[0].id);
        else if (exists) setActiveChatId(String(persisted));
      }
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
  }
}, [activeChatId]);

// Helper: progressively reveal a text into a new assistant message
const streamInMessage = useCallback(async (chatId, text) => {
  if (!text) return;
  // look for an existing streaming assistant message in the chat (created proactively on send)
  let id = null;
  try {
    const cur = chatsRef.current || [];
    const chat = cur.find((c) => String(c.id) === String(chatId));
    if (chat && Array.isArray(chat.messages)) {
      const existing = chat.messages.find((m) => m.role === 'assistant' && m.streaming === true);
      if (existing) id = existing.id;
    }
  } catch { /* ignore */ }

  // If no existing streaming message, create one
  if (!id) {
    id = 'stream_' + Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const assistantMsg = { id, role: 'assistant', content: '', time: Date.now(), streaming: true };
    addMessageToChat(chatId, assistantMsg);
  }

  setIsTyping(true);

  // Progressive reveal: chunk characters for speed and realism
  const total = text.length;
  let idx = 0;
  const minDelay = 6; // ms per char lower bound (slightly faster)
  const maxDelay = 20; // ms per char upper bound
  while (idx < total) {
    const chunkSize = Math.max(1, Math.floor(1 + Math.random() * 3));
    idx = Math.min(total, idx + chunkSize);
    const snippet = text.slice(0, idx);
    updateMessageInChat(chatId, id, snippet);
    try { const el = chatBoxRef.current; if (el) el.scrollTo({ top: el.scrollHeight + 200, behavior: 'smooth' }); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, Math.floor(minDelay + Math.random() * (maxDelay - minDelay))));
  }

  // mark as finished (remove streaming flag)
  updateMessageInChat(chatId, id, text, { streaming: false });
  setIsTyping(false);
}, []);

useEffect(() => {
  fetchChats();
  // init socket once
  try {
    const s = io('http://localhost:3000', { withCredentials: true });
    socketRef.current = s;
    s.on('connect', () => console.log('socket connected', s.id));
  s.on('ai-response', (payload) => {
      // payload: { contents, chat }
      try {
        const chatId = payload.chat;
        const text = payload.contents || payload.text || '';
        // stream the incoming text into the chat so it feels like typing
        streamInMessage(chatId, text);
      } catch { console.warn('ai-response handler error'); }
  });
  } catch (e) {
    console.warn('socket init failed', e);
  }
    }, [fetchChats, streamInMessage]);

// Helper: update a message's content inside a chat
function updateMessageInChat(chatId, msgId, newContent, extra = {}) {
  setChats((prev) => prev.map((c) => {
    if (c.id !== chatId) return c;
    const msgs = Array.isArray(c.messages) ? [...c.messages] : [];
    const next = msgs.map((m) => m.id === msgId ? { ...m, content: newContent, ...extra } : m);
    return { ...c, messages: next, lastMessage: (next.length ? next[next.length-1].content : c.lastMessage) };
  }));
}


// fetch current user from backend if available and persist
useEffect(() => {
  (async () => {
    try {
      const resp = await axios.get('http://localhost:3000/api/auth/me', { withCredentials: true });
      if (resp?.data?.user) {
        const u = resp.data.user;
        const name = (u.fullName && (u.fullName.firstName || u.fullName.lastName)) ? `${u.fullName.firstName || ''} ${u.fullName.lastName || ''}`.trim() : (u.email || 'User');
        setUserName(name);
        lsSet('cgpt_user', name);
      }
  } catch {
      // ignore if unauthenticated
    }
  })();
}, []);





  // ----- persist -----
  useEffect(() => {
    lsSet("cgpt_chats_v3", chats);
  }, [chats]);
  useEffect(() => {
    lsSet("cgpt_active_v3", activeChatId);
  }, [activeChatId]);
  // theme toggle removed — theme persistence not used here

  // header menu removed; keep profile dropdown handled below

  // close profile dropdown on outside click
  useEffect(() => {
    function onDoc(e) {
      if (e.type === 'keydown' && (e.key === 'Escape')) {
        setProfileOpen(false);
        setLeftUserMenuOpen(false);
        return;
      }
      if (e.type === 'click') {
        if (profileRef.current && !profileRef.current.contains(e.target)) {
          setProfileOpen(false);
        }
        if (leftUserRef.current && !leftUserRef.current.contains(e.target)) {
          setLeftUserMenuOpen(false);
        }
      }
    }
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onDoc);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onDoc);
    };
  }, []);

  // close left-user menu on outside click
  useEffect(() => {
    function onDoc(e) {
      if (!leftUserRef.current) return;
      if (e.type === 'click' && leftUserRef.current.contains(e.target)) return;
      if (e.type === 'keydown' && e.key === 'Escape') return setLeftUserMenuOpen(false);
      if (e.type === 'click') setLeftUserMenuOpen(false);
    }
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onDoc);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onDoc); };
  }, []);

  // read logged-in user name (if any) — mobile-first fallback
  useEffect(() => {
    try {
      const raw = lsGet("cgpt_user", null);
      if (raw) {
        setUserName(raw?.name || raw || null);
      } else {
        const u2 = lsGet("user", null) || lsGet("username", null);
        setUserName(u2);
      }
    } catch (e) {
      console.warn(e);
      setUserName(null);
    }
  }, []);

  // Listen for storage events so login from other pages updates name here
  useEffect(() => {
    function onStorage(e) {
      if (!e.key) return;
      if (["cgpt_user", "user", "username"].includes(e.key)) {
        const u = lsGet("cgpt_user", null) || lsGet("user", null) || lsGet("username", null);
        setUserName(u);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function logout() {
    (async () => {
      try {
        await axios.post('http://localhost:3000/api/auth/logout', {}, { withCredentials: true });
      } catch (e) { console.warn('logout failed', e); }
      lsSet('cgpt_user', null);
      lsSet('user', null);
      lsSet('username', null);
      setUserName(null);
      setProfileOpen(false);
      setLeftUserMenuOpen(false);
      showToast('Logged out');
  try { window.location.href = '/'; } catch (err) { console.warn('redirect failed', err); };
    })();
  }

  useEffect(() => {
    const el = chatBoxRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [activeChatId, isTyping]);

  // Auto-scroll whenever messages for the active chat change
  useEffect(() => {
    const el = chatBoxRef.current;
    if (!el) return;
    // small timeout to allow DOM updates
    const t = setTimeout(() => {
      try { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); } catch { el.scrollTop = el.scrollHeight; }
    }, 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  // auto-resize composer textarea like ChatGPT
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newH = Math.min(el.scrollHeight, 160);
    el.style.height = newH + 'px';
  }, [input]);

  



  // created new chat with title
async function createNewChat() {
  try {
    let title = "New chat";
    const t = window.prompt("Title for new chat:", "New chat");
    if (t !== null && t.trim() !== "") {
      title = t.trim();
    }

    // Backend request
    const res = await axios.post("http://localhost:3000/api/chat", {
      title
    }, {
      withCredentials: true   // agar cookie/session auth use kar rahe ho
    });

    const c = res.data.chat;
const newChat = {
  id: String(c.id || c._id),
  title: c.title || "New chat",
  createdAt: c.createdAt ? Number(new Date(c.createdAt)) : Date.now(),
  lastActivity: c.lastActivity || null,
  messages: [], // abhi backend sirf new chat deta hai, isliye empty
  pinned: !!c.pinned,
};
setChats((prev) => [newChat, ...prev]);

    // Sidebar state update
    setActiveChatId(newChat.id);
    setSidebarOpen(false);

  } catch (error) {
    console.error("Error creating chat:", error);
    alert("Failed to create chat");
  }
}


  function handleClearAll() {
    if (!confirm('Clear all chats? This cannot be undone.')) return;
    // Try to delete chats on backend (best-effort). Use Promise.allSettled so one failure doesn't block others.
    (async () => {
      try {
        const deletes = (chats || []).map((c) => axios.delete(`http://localhost:3000/api/chat/${c.id}`, { withCredentials: true }).catch((err) => err));
        await Promise.allSettled(deletes);
      } catch (err) {
        console.warn('Error deleting chats on server (ignored):', err);
      } finally {
        // clear local state and persisted keys
        setChats([]);
        setActiveChatId(null);
        createdChatRef.current = false;
        try { lsSet('cgpt_chats_v3', []); lsSet('cgpt_active_v3', null); } catch { /*best-effort*/ }
        showToast('All chats cleared');
      }
    })();
  }

  function deleteChat(id) {
    // optimistic UI remove
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (id === activeChatId) setActiveChatId(null);
  createdChatRef.current = false;
    showToast('Chat removed');
    // best-effort: try to delete on backend if route exists
    (async () => {
      try {
        await axios.delete(`http://localhost:3000/api/chat/${id}`, { withCredentials: true });
      } catch (e) {
        // ignore: backend may not support delete; keep optimistic UI
        console.warn('deleteChat backend call failed (ok if unsupported)', e);
      }
    })();
  }

  function togglePin(id) {
    setChats((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
        .sort((a, b) => {
          // pinned first, then by createdAt desc
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.createdAt - a.createdAt;
        })
    );
  }
  // rename helpers
  function openRename(id) {
    const chat = chats.find((c) => c.id === id);
    setRenameModal({ open: true, chatId: id, value: chat?.title || "" });
  }
  function applyRename() {
    setChats((prev) => prev.map((c) => (c.id === renameModal.chatId ? { ...c, title: renameModal.value } : c)));
    setRenameModal({ open: false, chatId: null, value: "" });
  }

  // delete a single message by index in a chat
  function deleteMessage(chatId, msgIndex) {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const msgs = Array.isArray(c.messages) ? [...c.messages] : [];
        msgs.splice(msgIndex, 1);
        return { ...c, messages: msgs };
      })
    );
  }

  // central helper to add a message to a chat and update lastMessage/title safely
  function addMessageToChat(chatId, message) {
    setChats((prev) => {
      const exists = prev.some((c) => c.id === chatId);
      if (!exists) {
        // create a new chat container and add the message
        const title = message.role === 'user' && message.content ? (message.content.length > 40 ? message.content.slice(0, 40) + '…' : message.content) : 'New chat';
        const newChat = {
          id: String(chatId),
          title,
          createdAt: Date.now(),
          lastActivity: Date.now(),
          messages: [message],
          lastMessage: message.content || '',
          pinned: false,
        };
        // set active chat immediately so UI updates correctly
  try { setActiveChatId(String(chatId)); } catch { /* noop */ }
        return [newChat, ...prev];
      }
      return prev.map((c) => {
        if (c.id !== chatId) return c;
        const msgs = Array.isArray(c.messages) ? [...c.messages] : [];
        const nextMsgs = [...msgs, message];
        // update lastMessage for sidebar preview and title if first message
        const nextTitle = msgs.length === 0 && message.role === 'user' ? (message.content && message.content.length > 40 ? message.content.slice(0, 40) + '…' : (message.content || c.title)) : c.title;
        return { ...c, messages: nextMsgs, lastMessage: message.content || '', title: nextTitle };
      });
    });
  }
    // Export functions removed — export was intentionally hidden from profile menu

  // toast helper
  function showToast(msg, ms = 1800) {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), ms);
  }

  // share or copy a message
  async function shareMessage(message) {
    const text = typeof message === "string" ? message : message.content || JSON.stringify(message);
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        // small visual feedback could be added later
      } else {
        // fallback: open a prompt so user can copy
        window.prompt("Copy message:", text);
      }
    } catch (err) {
      console.warn(err);
      try { await navigator.clipboard.writeText(text); showToast('Copied to clipboard'); } catch { window.prompt("Copy message:", text); }
    }
    showToast('Shared/copied');
  }
   //replace with real API call when ready
   async function getAIReply(prompt) {
     // Try backend AI endpoint if available, otherwise fallback to stub
     try {
       const resp = await fetch("/api/ai", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ prompt }),
       });
       if (resp.ok) {
         const data = await resp.json();
         // expected { text }
         return data.text || data.answer || "(no response)";
       }
     } catch (e) {
       console.warn("AI fetch failed", e);
     }
    // fallback stub: faster for better UX locally
    await new Promise((r) => setTimeout(r, 180 + Math.random() * 220));
    return `Here’s a neat response to: "${prompt}" — generated just now.`;
   }

  
// Home.jsx

// ... बाकी का सारा code unchanged ...

async function handleSend(e) {
  e?.preventDefault();
  const text = input.trim();
  if (!text) return;

  setBusy(true);

  let cid = activeChatId;
  let newChatCreated = false; // track karega ki abhi nayi chat bani hai ya nahi

  if (!cid) {
    try {
      const suggestedTitle = text.length > 40 ? text.slice(0, 40) + '…' : text || 'New chat';
      const resp = await axios.post('http://localhost:3000/api/chat', { title: suggestedTitle,
          firstMessage: text 
       }, { withCredentials: true });
      const created = resp?.data?.chat;
      const newId = created?.id || Date.now().toString();

      // yahin user ka pehla message daal do
      const userMsg = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        role: 'user',
        content: text,
        time: Date.now()
      };

      const newChat = {
        id: newId,
        title: created?.title || suggestedTitle,
        createdAt: Date.now(),
        messages: [userMsg],
        lastMessage: text,
        pinned: false
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newId);
      cid = newId;
      newChatCreated = true;
      setInput(""); // composer clear
    } catch (err) {
      console.warn('create chat failed, falling back to local', err);
      cid = Date.now().toString();

      const userMsg = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        role: 'user',
        content: text,
        time: Date.now()
      };

      const newChat = {
        id: cid,
        title: 'New chat',
        createdAt: Date.now(),
        messages: [userMsg],
        lastMessage: text,
        pinned: false
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(cid);
      newChatCreated = true;
      setInput("");
    }
  }

  // agar chat pehle se exist karti hai tab hi addMessageToChat chalayenge
  if (!newChatCreated) {
    const userMsg = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      role: 'user',
      content: text,
      time: Date.now()
    };
    addMessageToChat(cid, userMsg);
    setInput("");
  }

  setIsTyping(true);

  try {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('ai-message', { chat: cid, content: text });
    } else {
      const replyText = await getAIReply(text);
      await streamInMessage(cid, replyText);
    }
  } catch (e) {
    console.warn(e);
    addMessageToChat(cid, {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Error: failed to get answer',
      time: Date.now(),
      error: true
    });
  } finally {
    setIsTyping(false);
    setBusy(false);
  }
}


// ... बाकी का सारा code unchanged ...
 


 

// Speech Recognition 
 function toggleListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition not supported in this browser');
        return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!recogRef.current) {
        const r = new SpeechRec();
        r.lang = 'en-IN';
        r.interimResults = true;
        preSpeechRef.current = input || "";

        r.onresult = (ev) => {
            let interim = "";
            let final = "";

            for (let i = ev.resultIndex; i < ev.results.length; i++) {
                const res = ev.results[i];
                if (res.isFinal) {
                    final += res[0].transcript;
                } else {
                    interim += res[0].transcript;
                }
            }
            // Update the input field with the new text
            const newText = preSpeechRef.current + final + interim;
            setInput(newText);
        };

      r.onend = () => {
    setListening(false);
    recogRef.current = null;
    preSpeechRef.current = ""; // Reset temporary storage
    
    if (input && input.trim()) {
    handleSend();
  }
   
};

r.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    setListening(false);
    recogRef.current = null;
};

        recogRef.current = r;
        r.start();
        setListening(true);
    } else {
        try { recogRef.current.stop(); } catch (err) { console.warn('stop failed', err); }
        recogRef.current = null;
        setListening(false);
    }
} 

// Add this useEffect hook to your component to handle the automatic send
// This will run whenever the 'input' state changes and the 'listening' state is false
  // Dependencies: listening and input states












  

  // search + filtered list (pinned first)
  const filtered = useMemo(() =>
    chats
      .filter((c) => {
        if (!searchQ) return true;
        return (c.title || "").toLowerCase().includes(searchQ.toLowerCase()) || formatPreview(c.messages).toLowerCase().includes(searchQ.toLowerCase());
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      }),
    [chats, searchQ]
  );

 

  // small MessageRow component placed before JSX return
  const MessageRow = ({ m, onDelete, onShare }) => {
    const isUser = m.role === "user";
    const open = openMsgId === m.id;
    return (
      <div className={`msg-row ${isUser ? "msg-user" : "msg-assistant"}`} onClick={() => setOpenMsgId(open ? null : m.id)} tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter') setOpenMsgId(open ? null : m.id); }}>
         <div className="msg-avatar">
           {isUser ? (
             <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
               <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
             </svg>
           ) : (
             /* assistant: simple robot/AI head icon */
            /*  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
               <path d="M12 2c-1.1 0-2 .9-2 2v1H8c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h.5v1.5c0 .8.7 1.5 1.5 1.5h6c.8 0 1.5-.7 1.5-1.5V12H18c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2V4c0-1.1-.9-2-2-2h-2zM9 9a1 1 0 110 2 1 1 0 010-2zm6 0a1 1 0 110 2 1 1 0 010-2z"/>
             </svg> */
             <p><img src="../logo.png" alt="" /></p>
           )
           }
         </div>
         <div className="msg-bubble-wrapper">
           <div className="msg-bubble">
             <div className="msg-text">{m.content}</div>
           </div>
           <div className={`msg-actions-below ${open ? 'open' : ''}`}>
             <div className="msg-actions-row">
               <button className="action" data-title="Copy" onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(m.content || '') && showToast('Copied'); }} aria-label="Copy">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zM20 5H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h12v14z"/></svg>
               </button>
               <button className="action" data-title="Share" onClick={(e) => { e.stopPropagation(); onShare && onShare(); }} aria-label="Share">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.3 3.3 0 0 0 0-1.4l7.05-4.11A2.99 2.99 0 1 0 15 5a2.99 2.99 0 0 0 .96 2.22L8.91 11.33a3 3 0 1 0 0 1.34l7.13 4.15c-.08.22-.09.46-.09.68A3 3 0 1 0 18 16.08z"/></svg>
               </button>
               <button className="action" data-title="Delete" onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }} aria-label="Delete">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
               </button>
               <button className="action" data-title="Speak" onClick={(e) => { e.stopPropagation(); speakText(m.content); }} aria-label="Speak">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3 10v4h4l5 5V5L7 10H3zM19 12c0-1.77-.77-3.36-2-4.47v8.94c1.23-1.11 2-2.7 2-4.47z"/></svg>
               </button>
             </div>
             
           </div>
         </div>
       </div>
     );
   };

 

  // Text-to-speech helper
  function speakText(text) {
    try {
  if (!window.speechSynthesis) return showToast('TTS not supported');
  const utter = new SpeechSynthesisUtterance(text);
  // prefer Indian English voice when available
  utter.lang = 'en-IN';
  utter.rate = 0.98; // slight slower for clarity
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('speak failed', e);
    }
  }

  // Export / Import chats

  
  return (
  <div className="cgpt-wrap v3">
      {/* Sidebar */}
      <aside className={`cgpt-left ${sidebarOpen ? "open" : ""}`} > {/* //aria-hidden={!sidebarOpen} */}
        <div className="left-top">
          <div className="brand">Mitra Ai</div>
          <button className="close-side" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        <div className="left-controls">
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <button className="new-chat-btn" onClick={createNewChat}>
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
              <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
            </svg>
            New chat
          </button>
          <button className="new-chat-btn" style={{background:'#cd1010db', color:'#fffefeff'}} onClick={handleClearAll}>Clear all</button>
         
          </div>

          <div className="search-wrap">
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search chats" />
            <button onClick={() => setSearchQ("")} aria-label="clear" className="clear"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          </div>
        </div>

        <div className="left-list">
          {filtered.length === 0 ? (
            <div className="left-empty">No chats yet — start a new one</div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className={`left-item ${c.id === activeChatId ? "active" : ""}`} onClick={() => { setActiveChatId(c.id); setSidebarOpen(false); }}>
                <div className="left-item-main">
                  <span className="left-dot" aria-hidden>{c.pinned ? (<p>📌</p>) : (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zM4 10h12v2H4zM4 14h8v2H4z"/></svg>)}</span>
                  <div className="left-meta">
                    <div className="left-title">{c.title || "New chat"}</div>
                    {/* <div className="left-preview">{c.lastMessage || "No messages yet"}</div> */}
                  </div>
                </div>

                <div className="left-actions">
                  <button className={`pin ${c.pinned ? "pinned" : ""}`} onClick={(e) => { e.stopPropagation(); togglePin(c.id); }} title="Pin chat">
                    {c.pinned ? (
                      // <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      //   <path d="M14.5 2.5l2 2L8 13l-2-2L14.5 2.5zM6 20l6-6 8.5 8.5L20 24l-8-4-6 0z" />
                      // </svg>
                       <p>📌</p>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2l3 3-7 7 1 1 7-7 3 3v6h-6l-3-3-7 7v-6l7-7-3-3z" />
                      </svg>
                      // <p>📌</p>
                    )}
                  </button>
                  <button className="rename" onClick={(e) => { e.stopPropagation(); openRename(c.id); }} title="Rename">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button className="left-delete" onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                
                
                </div>
              </div>
            ))
          )}
        </div>

        <div className="left-bottom" ref={leftUserRef}>
          <div className="left-user" onClick={(e) => { e.stopPropagation(); setLeftUserMenuOpen(s => !s); }} role="button" tabIndex={0}>
            <div className="left-user-avatar">{(userName || "G").charAt(0).toUpperCase()}</div>
            <div className="left-user-meta">
              <div className="left-user-name">{userName || "Guest"}</div>
              <a href="#" className="muted small">Manage</a>
            </div>
          </div>
          {leftUserMenuOpen && (
            <div className="left-user-menu">
              <button className="menu-item" onClick={() => logout()}>Logout</button>
            </div>
          )}
        </div>
      </aside>

  {/* MessageRow is defined above (kept as a const before the return) */}

  {/* Overlay for mobile when sidebar is open */}
  <div className="overlay" onClick={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="cgpt-main">
  <header className="main-head">
          <div className="hdr-left">
            <button className="hamb" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/></svg>
            </button>
            <div className="hdr-title">Mitra Ai</div>
            <div className="hdr-search">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M21 21l-4.35-4.35"/></svg>
              <input placeholder="Search messages or chats" value={searchQ} onChange={(e)=>setSearchQ(e.target.value)} />
            </div>
          </div>
          <div className="hdr-right" ref={profileRef}>
             <div className="profile-wrap">
               <button className="avatar-btn" onClick={(e)=>{ e.stopPropagation(); const next = !profileOpen; if(next){ const u = lsGet("cgpt_user", null) || lsGet("user", null) || lsGet("username", null); setUserName(u); } setProfileOpen(next); }} aria-haspopup="true">{(userName||'G').charAt(0).toUpperCase()}</button>
                <span className="hdr-username">{userName || 'Guest'}</span>
               {profileOpen && (
                <div className="profile-menu">
                  {userName ? (
                    <button className="menu-item" onClick={()=>{ logout(); }}>Logout</button>
                  ) : (
                    <button className="menu-item" onClick={()=>{ window.location.href = '/login'; }}>Login</button>
                  )}
                  {/* keep import hidden but available if needed in future */}
                 
                </div>
               )}
             </div>
           </div>
         </header>

          {/* toast */}
          {toast.show && (
            <div className="cgpt-toast" role="status">{toast.msg}</div>
          )}

        <div className="chat-area" ref={chatBoxRef}>
          {(!activeChat || messages.length === 0) ? (
            <div className="hero">
              <h2 className="hero-title">Hey! 👋 How’s it going?</h2><br />
              <div className="hero-actions">
                <button onClick={() => { setInput("Who created you ?"); document.querySelector(".composer-input")?.focus?.(); }}>Who Create You ?</button>
                <button onClick={() => { setInput("Explain async/await in JavaScript"); document.querySelector(".composer-input")?.focus?.(); }}>Explain a concept</button>
                <button onClick={() => { setInput("How to fix this error: ..."); document.querySelector(".composer-input")?.focus?.(); }}>Debug code</button>
              </div>
            </div>
          ) : (
            <div className="msgs">
              {messages.map((m, i) => (
                <MessageRow key={m.id || i} m={m} onDelete={() => deleteMessage(activeChatId, i)} onShare={() => shareMessage(m)} />
              ))}

              {isTyping && (
                <div className="msg-row msg-assistant typing-row" aria-live="polite">
                  <div className="msg-avatar">
                    {/* <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2a10 10 0 0 0-3.16 19.45c.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.004 1.71.115 2.51.337 1.9-1.29 2.74-1.02 2.74-1.02.56 1.39.21 2.41.11 2.66.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .27.18.59.69.49A10 10 0 0 0 12 2z"/>
                    </svg> */}
                    <img src="../logo.png" alt="" />
                  </div>
              
                  <div className="msg-bubble typing typing-preview" aria-hidden={false}>
                    <div className="typing-content">
                      <span className="typing-text">Mitra is typing</span>
                      <span className="typing-cursor" aria-hidden="true" />
                    </div>
                    <div className="typing-dots" aria-hidden="true">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* composer */}
        <form className="composer" onSubmit={handleSend}>
          <div className="composer-inner">
            <button type="button" className={`icon mic ${listening ? 'listening' : ''}`} title={listening ? 'Stop' : 'Voice'} onClick={toggleListening} aria-pressed={listening}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 20h2v3h-2z"/></svg>
            </button>
            <textarea
              ref={composerRef}
              className="composer-input textarea"
              placeholder="Message Mitra AI …"
              value={input}
              onChange={async (e) => {
                  const v = e.target.value;
                  setInput(v);
                  // If no active chat exists, create one once when user starts typing
                  if (!activeChatId && v.trim().length > 0 && !createdChatRef.current) {
                    createdChatRef.current = true;
                    const suggestedTitle = v.length > 40 ? v.slice(0,40) + '…' : (v || 'New chat');
                    try {
                      const resp = await axios.post('http://localhost:3000/api/chat', { title: suggestedTitle }, { withCredentials: true });
                      const created = resp?.data?.chat;
                      const newId = String(created?.id || created?._id || Date.now().toString());
                      const newChat = { id: newId, title: created?.title || suggestedTitle, createdAt: created?.createdAt ? Number(new Date(created.createdAt)) : Date.now(), messages: [], pinned: false };
                      setChats((prev) => [newChat, ...prev]);
                      setActiveChatId(newId);
                    } catch (err) {
                      console.warn('silent create chat failed', err);
                      // fallback: create local-only chat id so subsequent send works and preserve typed title
                      const cid = Date.now().toString();
                      const newChat = { id: cid, title: suggestedTitle || 'New chat', createdAt: Date.now(), messages: [], pinned: false };
                      setChats((prev) => [newChat, ...prev]);
                      setActiveChatId(cid);
                    }
                  }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              spellCheck={false}
              autoComplete="off"
            />
            <button type="submit" className="send-btn" title="Send" disabled={busy} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
            </button>
          </div>
        </form>
  {/* FAB removed */}
      </div>

      {/* Rename modal */}
      {renameModal.open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Rename chat</h3>
            <input value={renameModal.value} onChange={(e) => setRenameModal(prev => ({ ...prev, value: e.target.value }))} />
            <div className="modal-actions">
              <button onClick={() => setRenameModal({ open: false, chatId: null, value: "" })} className="btn-ghost">Cancel</button>
              <button onClick={applyRename} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




