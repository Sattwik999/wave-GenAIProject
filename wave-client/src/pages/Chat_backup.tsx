import { useEffect, useRef, useState } from 'react'
import { apiChat, apiModerate } from '../services/api'
import { demoReply } from '../services/demoAI'
import { supabase } from '../services/supabaseClient'

type Msg = { 
  id: string
  from: 'user' | 'bot'
  text: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

export default function Chat(){
  const createMessage = (from: 'user' | 'bot', text: string, status: 'sending' | 'sent' | 'error' = 'sent'): Msg => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    from,
    text,
    timestamp: new Date(),
    status
  })

  const [msgs, setMsgs] = useState<Msg[]>([
    createMessage('bot', 'Hi! I\'m here to listen. What\'s on your mind today?')
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, typing])

  async function send(){
    if (!input.trim()) return
    const text = input.trim()
    const userMsg = createMessage('user', text)
    setMsgs(m=>[...m, userMsg])
    setInput(''); setTyping(true)
    try{
      const flagged = await apiModerate(text)
      if (flagged){ 
        const botMsg = createMessage('bot', 'This might be urgent. Try the Crisis page for breathing exercises and helplines if you need immediate support.')
        setMsgs(m=>[...m, botMsg])
        return 
      }
      let reply = ''
      try{ reply = await apiChat(text) } catch{ reply = demoReply(text) }
      const botMsg = createMessage('bot', reply)
      setMsgs(m=>[...m, botMsg])
    } finally { setTyping(false) }
  }

  return (
    <>
      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 85vh;
          max-height: 85vh;
          gap: 1rem;
          position: relative;
          background: linear-gradient(135deg, rgba(30,27,75,0.95), rgba(15,15,40,0.98));
          border-radius: 20px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(139,92,246,0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }

        .chat-messages {
          flex: 1;
          position: relative;
          background: rgba(11, 18, 32, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .messages-inner {
          padding: 2rem;
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.3) transparent;
        }

        .messages-inner::-webkit-scrollbar {
          width: 6px;
        }

        .messages-inner::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-inner::-webkit-scrollbar-thumb {
          background: rgba(139,92,246,0.3);
          border-radius: 3px;
        }

        .message-wrapper {
          display: flex;
          margin: 1.5rem 0;
          animation: slideIn 0.3s ease-out;
          gap: 0.75rem;
        }

        .message-user {
          justify-content: flex-end;
        }

        .message-bot {
          justify-content: flex-start;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(139,92,246,0.6), rgba(79,70,229,0.8));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
          border: 2px solid rgba(139,92,246,0.3);
          box-shadow: 0 4px 12px rgba(139,92,246,0.2);
        }

        .avatar-user {
          background: linear-gradient(135deg, rgba(34,197,94,0.6), rgba(22,163,74,0.8));
          border-color: rgba(34,197,94,0.3);
          box-shadow: 0 4px 12px rgba(34,197,94,0.2);
        }

        .message-content {
          max-width: 70%;
          display: flex;
          flex-direction: column;
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
          color: rgba(196, 181, 253, 0.7);
        }

        .message-bubble {
          position: relative;
          padding: 1rem 1.5rem;
          border-radius: 18px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(139,92,246,0.2);
          transition: all 0.3s ease;
        }

        .message-bubble:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139,92,246,0.2);
        }

        .bubble-user {
          background: linear-gradient(135deg, 
            rgba(139,92,246,0.3) 0%, 
            rgba(79,70,229,0.2) 100%);
          border-color: rgba(139,92,246,0.4);
          border-radius: 18px 18px 6px 18px;
        }

        .bubble-bot {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(139,92,246, 0.05) 100%);
          border-color: rgba(139,92,246,0.2);
          border-radius: 18px 18px 18px 6px;
        }

        .message-text {
          color: #E5E7EB;
          line-height: 1.6;
          position: relative;
          z-index: 2;
        }

        .message-status {
          font-size: 0.65rem;
          color: rgba(196, 181, 253, 0.5);
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-sending {
          color: rgba(251, 191, 36, 0.8);
        }

        .status-sent {
          color: rgba(34, 197, 94, 0.8);
        }

        .status-error {
          color: rgba(239, 68, 68, 0.8);
        }

        .typing-indicator {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          padding: 1rem 0;
        }

        .typing-content {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(139,92,246, 0.05) 100%);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 18px;
          padding: 1rem 1.5rem;
          backdrop-filter: blur(10px);
        }

        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(139,92,246,0.6);
          animation: typing 1.4s infinite ease-in-out;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        .dot:nth-child(3) { animation-delay: 0s; }

        .chat-input-container {
          position: relative;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(11, 18, 32, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 20px;
          padding: 4px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .input-wrapper:focus-within {
          border-color: rgba(139,92,246,0.5);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(139,92,246,0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 1rem 1.5rem;
          color: #E5E7EB;
          font-size: 1rem;
          line-height: 1.5;
          border-radius: 16px;
        }

        .chat-input::placeholder {
          color: rgba(196, 181, 253, 0.5);
        }

        .chat-input:disabled {
          opacity: 0.5;
        }

        .send-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, 
            rgba(139,92,246,0.8) 0%, 
            rgba(79,70,229,0.6) 100%);
          border: 1px solid rgba(139,92,246,0.3);
          border-radius: 16px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          margin-left: 0.5rem;
        }

        .send-button:hover:not(:disabled) {
          background: linear-gradient(135deg, 
            rgba(139,92,246,1) 0%, 
            rgba(79,70,229,0.8) 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139,92,246,0.3);
        }

        .send-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .chat-container {
            height: 80vh;
            max-height: 80vh;
            padding: 1rem;
          }
          
          .messages-inner {
            padding: 1rem;
          }
          
          .message-content {
            max-width: 80%;
          }
          
          .message-bubble {
            padding: 0.875rem 1.25rem;
          }
          
          .message-avatar {
            width: 36px;
            height: 36px;
            font-size: 1rem;
          }
          
          .input-wrapper {
            padding: 3px;
          }
          
          .chat-input {
            padding: 0.875rem 1.25rem;
          }
          
          .send-button {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .messages-inner {
          padding: 2rem;
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .messages-inner::-webkit-scrollbar {
          width: 6px;
        }

        .messages-inner::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-inner::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .message-wrapper {
          display: flex;
          margin: 1.5rem 0;
          animation: slideIn 0.3s ease-out;
        }

        .message-user {
          justify-content: flex-end;
        }

        .message-bot {
          justify-content: flex-start;
        }

        .message-bubble {
          position: relative;
          max-width: 75%;
          padding: 1rem 1.5rem;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .message-bubble:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .bubble-user {
          background: linear-gradient(135deg, 
            rgba(26, 115, 232, 0.3) 0%, 
            rgba(26, 115, 232, 0.1) 100%);
          border-color: rgba(26, 115, 232, 0.3);
        }

        .bubble-bot {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.05) 100%);
        }

        .message-text {
          color: #E5E7EB;
          line-height: 1.6;
          position: relative;
          z-index: 2;
        }

        .message-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .bubble-user .message-glow {
          background: linear-gradient(135deg, 
            rgba(26, 115, 232, 0.2) 0%, 
            rgba(26, 115, 232, 0.1) 100%);
          box-shadow: 0 0 20px rgba(26, 115, 232, 0.3);
        }

        .bubble-bot .message-glow {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.05) 100%);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .message-bubble:hover .message-glow {
          opacity: 1;
        }

        .typing-indicator {
          padding: 1rem 1.5rem;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(229, 231, 235, 0.6);
          animation: typing 1.4s infinite ease-in-out;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        .dot:nth-child(3) { animation-delay: 0s; }

        .chat-input-container {
          position: relative;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          background: rgba(11, 18, 32, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 4px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .input-wrapper:focus-within {
          border-color: rgba(26, 115, 232, 0.5);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(26, 115, 232, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 1rem 1.5rem;
          color: #E5E7EB;
          font-size: 1rem;
          line-height: 1.5;
          border-radius: 16px;
        }

        .chat-input::placeholder {
          color: rgba(229, 231, 235, 0.5);
        }

        .chat-input:disabled {
          opacity: 0.5;
        }

        .send-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, 
            rgba(26, 115, 232, 0.8) 0%, 
            rgba(26, 115, 232, 0.6) 100%);
          border: 1px solid rgba(26, 115, 232, 0.3);
          border-radius: 16px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .send-button:hover:not(:disabled) {
          background: linear-gradient(135deg, 
            rgba(26, 115, 232, 1) 0%, 
            rgba(26, 115, 232, 0.8) 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(26, 115, 232, 0.3);
        }

        .send-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .send-button.sending {
          animation: pulse 1s infinite;
        }

        .send-icon {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .send-button:hover:not(:disabled) .send-icon {
          transform: translateX(2px);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .chat-container {
            height: 60vh;
            max-height: 60vh;
          }
          
          .messages-inner {
            padding: 1rem;
          }
          
          .message-bubble {
            max-width: 85%;
            padding: 0.875rem 1.25rem;
          }
          
          .input-wrapper {
            padding: 3px;
          }
          
          .chat-input {
            padding: 0.875rem 1.25rem;
          }
          
          .send-button {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
      
      <div className="chat-container">
        {/* Main Chat Area */}
        <div className="chat-messages">
          <div className="messages-inner">
            {msgs.map((m,i)=>(
              <div key={i} className={`message-wrapper ${m.from==='user'?'message-user':'message-bot'}`}>
                <div className={`message-bubble ${m.from==='user'?'bubble-user':'bubble-bot'}`}>
                  <div className="message-text">{m.text}</div>
                  <div className="message-glow"></div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="message-wrapper message-bot">
                <div className="bubble-bot typing-indicator">
                  <div className="typing-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <div className="message-glow"></div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="chat-input-container">
          <div className="input-wrapper">
            <input 
              className="chat-input" 
              value={input} 
              onChange={e=>setInput(e.target.value)} 
              onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} 
              placeholder="Share what's on your mind..."
              disabled={typing}
            />
            <button 
              className={`send-button ${typing ? 'sending' : ''}`}
              onClick={send}
              disabled={typing || !input.trim()}
            >
              <svg viewBox="0 0 24 24" className="send-icon">
                <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}