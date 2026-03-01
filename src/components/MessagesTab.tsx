import { useEffect, useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { Eyebrow } from './UI';
import { generateMockRestaurantReply } from '../lib/gemini';
import type { ChatMessage } from '../types';

function formatTimestamp(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const QUICK_PROMPTS = [
  'I am 8 minutes away. Is pickup at the front desk?',
  'Can you confirm portions and packaging?',
  'Any allergy notes I should share with the shelter?',
];

export default function MessagesTab() {
  const { activeRun, user, runMessages, addRunMessage, setActiveTab, showToast } = useApp();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const activeRunIdRef = useRef<string | null>(activeRun?.id ?? null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runMessages, isTyping]);

  useEffect(() => {
    activeRunIdRef.current = activeRun?.id ?? null;
    setDraft('');
    setSending(false);
    setIsTyping(false);
  }, [activeRun?.id]);

  const sendDriverMessage = async (rawMessage: string) => {
    if (!activeRun || sending) return;
    const runIdAtSend = activeRun.id;
    const text = rawMessage.trim();
    if (!text) return;

    const driverMessage: ChatMessage = {
      id: `msg-${Date.now()}-driver`,
      sender: 'driver',
      text,
      createdAt: new Date(),
    };

    addRunMessage(driverMessage);
    setDraft('');
    setSending(true);
    setIsTyping(true);

    try {
      const reply = await generateMockRestaurantReply(text, {
        restaurantName: activeRun.post.restaurantName,
        foodDescription: activeRun.post.foodDescription,
        portions: activeRun.post.portions,
        pickupBy: activeRun.post.pickupBy,
        shelterName: activeRun.shelter.name,
      });

      if (activeRunIdRef.current !== runIdAtSend) return;
      addRunMessage({
        id: `msg-${Date.now()}-restaurant`,
        sender: 'restaurant',
        text: reply,
        createdAt: new Date(),
      });
    } catch {
      showToast('Could not generate mock reply. Try again.');
    } finally {
      setIsTyping(false);
      setSending(false);
    }
  };

  if (!activeRun) {
    return (
      <div className="body">
        <div className="empty" style={{ paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>
            No active order chat
          </div>
          <div style={{ fontSize: 13, color: 'var(--warm-grey)', lineHeight: 1.6, marginBottom: 16 }}>
            Claim a pickup to unlock driver-to-restaurant messaging.
          </div>
          <button className="btn btn-outline" onClick={() => setActiveTab('feed')}>
            View available pickups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="body messages-body">
      <Eyebrow>Order chat</Eyebrow>

      <div className="messages-head">
        <div className="messages-title">{activeRun.post.restaurantName}</div>
        <div className="messages-sub">
          Driver: {user.firstName} {user.lastName} · {activeRun.post.portions} portions · pickup by {activeRun.post.pickupBy}
        </div>
      </div>

      <div className="messages-thread">
        {runMessages.map(message => (
          <div key={message.id} className={`message-row ${message.sender === 'driver' ? 'driver' : 'restaurant'}`}>
            <div className="message-bubble">
              <div className="message-text">{message.text}</div>
              <div className="message-time">{formatTimestamp(message.createdAt)}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-row restaurant">
            <div className="message-bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      <div className="quick-prompts">
        {QUICK_PROMPTS.map(prompt => (
          <button
            key={prompt}
            className="prompt-chip"
            disabled={sending}
            onClick={() => void sendDriverMessage(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="message-compose">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the restaurant as driver..."
          rows={2}
          disabled={sending}
        />
        <button
          className="btn"
          disabled={sending || !draft.trim()}
          onClick={() => void sendDriverMessage(draft)}
        >
          {sending ? 'Generating reply…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
