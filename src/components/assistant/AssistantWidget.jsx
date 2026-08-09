import { useState, useRef, useEffect } from 'react';
import { Drawer, FloatButton, Input, Button, Spin, Typography, Alert } from 'antd';
import { MessageOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import assistantService from '../../features/assistant/assistantService';

const { Text } = Typography;

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser ? 'var(--lab-teal-soft)' : 'var(--glass-blue-soft)',
          color: isUser ? 'var(--lab-teal-deep)' : 'var(--glass-blue)',
        }}
      >
        {isUser ? <UserOutlined /> : <RobotOutlined />}
      </div>
      <div
        style={{
          maxWidth: '78%',
          padding: '9px 13px',
          borderRadius: 10,
          background: isUser ? 'var(--lab-teal)' : 'var(--panel)',
          color: isUser ? '#fff' : 'var(--ink)',
          border: isUser ? 'none' : '1px solid var(--hairline)',
          fontSize: 13.5,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {content}
      </div>
    </div>
  );
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Assalomu alaykum! Men ChemLab UZ AI yordamchisiman. Namunalar, reaktivlar yoki tajribalar bo'yicha savol bering." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      // Backendga faqat user/assistant xabarlarini (tanishtiruv matnisiz) yuboramiz
      const history = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1); // oxirgi (hozirgi) xabarni alohida 'message' sifatida yuboramiz

      const { reply } = await assistantService.sendMessage(text, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const detail = err.response?.data?.detail || "AI yordamchidan javob olib bo'lmadi.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <FloatButton
        icon={<MessageOutlined />}
        type="primary"
        style={{ insetInlineEnd: 28, insetBlockEnd: 28, width: 52, height: 52 }}
        onClick={() => setOpen(true)}
        tooltip="AI yordamchi"
      />

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RobotOutlined style={{ color: 'var(--lab-teal)' }} />
            <span>AI Yordamchi</span>
          </div>
        }
        placement="right"
        width={400}
        open={open}
        onClose={() => setOpen(false)}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 4px' }}
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <Spin size="small" />
              <Text type="secondary" style={{ fontSize: 12.5 }}>Yozmoqda...</Text>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '0 16px' }}>
            <Alert type="error" showIcon message={error} style={{ marginBottom: 10, fontSize: 12.5 }} />
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--hairline)', padding: 12, display: 'flex', gap: 8 }}>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Savolingizni yozing... (Enter — yuborish)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          />
        </div>
      </Drawer>
    </>
  );
}
