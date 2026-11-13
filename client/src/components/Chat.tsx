import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CHAT_MAX_LENGTH, type ChatMessage } from '@skribbl/shared';
import { sendChat, useGame } from '../store';

interface Props {
  /** Why the input is disabled, if it is. */
  disabledReason?: string | null;
  placeholder?: string;
}

function Line({ msg }: { msg: ChatMessage }) {
  switch (msg.kind) {
    case 'system':
      return <li className="px-2 py-0.5 text-sm font-semibold text-indigo-600">{msg.text}</li>;
    case 'correct':
      return <li className="bg-green-100 px-2 py-0.5 font-bold text-green-700">{msg.text}</li>;
    case 'close':
      return <li className="bg-yellow-100 px-2 py-0.5 font-semibold text-yellow-800">{msg.text}</li>;
    case 'guessed':
      return (
        <li className="bg-green-50 px-2 py-0.5 text-green-800">
          <span className="font-bold">{msg.name}:</span> {msg.text}
        </li>
      );
    default:
      return (
        <li className="px-2 py-0.5 text-slate-800 odd:bg-slate-50">
          <span className="font-bold">{msg.name}:</span> {msg.text}
        </li>
      );
  }
}

export function Chat({ disabledReason, placeholder = 'Type your guess here…' }: Props) {
  const messages = useGame((s) => s.messages);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const stickToBottom = useRef(true);

  // Auto-scroll unless the user scrolled up to read history.
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || disabledReason) return;
    sendChat(t);
    setText('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-lg">
      <ul ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto py-1 break-words" aria-live="polite">
        {messages.map((m) => (
          <Line key={m.id} msg={m} />
        ))}
      </ul>
      <form onSubmit={onSubmit} className="border-t-2 border-slate-100 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={CHAT_MAX_LENGTH}
          disabled={!!disabledReason}
          placeholder={disabledReason ?? placeholder}
          aria-label="Chat message"
          autoComplete="off"
          className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-400 disabled:bg-slate-100"
        />
      </form>
    </div>
  );
}
