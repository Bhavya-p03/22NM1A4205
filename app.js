https://www.thunderclient.com/welcome
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './index.css';

// ============= Logger =============
const useLogger = () => {
  const [logs, setLogs] = useState([]);
  const log = (type, message, meta = {}) => {
    const entry = { ts: new Date().toISOString(), type, message, meta };
    console[type === 'error' ? 'error' : 'log'](`[${entry.ts}] ${type}: ${message}`, meta);
    setLogs((prev) => [...prev, entry]);
  };
  return { logs, log };
};

// ============= Local Storage Helpers =============
const loadLinks = () => JSON.parse(localStorage.getItem('links') || '[]');
const saveLinks = (links) => localStorage.setItem('links', JSON.stringify(links));

// ============= Shortener Component =============
const Shortener = ({ log }) => {
  const [url, setUrl] = useState('');
  const [custom, setCustom] = useState('');
  const [links, setLinks] = useState(loadLinks());

  const generateCode = () => Math.random().toString(36).substring(2, 7);

  const handleShorten = () => {
    if (!url.startsWith('http')) {
      log('error', 'Invalid URL');
      return;
    }
    let code = custom || generateCode();
    if (links.find((l) => l.code === code)) {
      log('error', 'Code already exists');
      return;
    }
    const newLink = { code, original: url, createdAt: Date.now() };
    const updated = [...links, newLink];
    setLinks(updated);
    saveLinks(updated);
    log('info', `Created short link: ${code}`, { original: url });
    setUrl('');
    setCustom('');
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow-lg rounded-xl">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">🔗 URL Shortener</h1>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Enter full URL (https://...)"
          className="border border-gray-300 rounded p-3 w-full focus:ring-2 focus:ring-blue-400"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          type="text"
          placeholder="Custom short code (optional)"
          className="border border-gray-300 rounded p-3 w-full focus:ring-2 focus:ring-blue-400"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition" onClick={handleShorten}>Shorten URL</button>
      </div>
      <ul className="mt-6 space-y-2">
        {links.map((l) => (
          <li key={l.code} className="p-3 bg-gray-100 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <a className="text-blue-700 font-mono break-all" href={`/r/${l.code}`}>{window.location.origin}/r/{l.code}</a>
            <span className="text-gray-500 text-sm">→ {l.original}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ============= Redirect Page =============
const Redirect = ({ log }) => {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const links = loadLinks();
    const found = links.find((l) => l.code === code);
    if (found) {
      log('info', `Redirecting to ${found.original}`);
      window.location.href = found.original;
    } else {
      log('error', `No link found for code: ${code}`);
      navigate('/');
    }
  }, [code]);

  return <p className="text-center p-4 text-gray-600">Redirecting...</p>;
};

// ============= Logger Panel =============
const LoggerPanel = ({ logs }) => (
  <div className="p-4 bg-gray-50 border rounded-xl mt-6 max-w-xl mx-auto">
    <h2 className="font-bold text-lg mb-2">📜 Logs</h2>
    <div className="h-40 overflow-auto text-xs space-y-1">
      {logs.map((l, i) => (
        <div key={i} className="border-b py-1">
          <span className="text-gray-600">[{new Date(l.ts).toLocaleTimeString()}]</span>
          <span className={`ml-2 font-semibold ${l.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{l.type.toUpperCase()}</span>
          <span className="ml-2">{l.message}</span>
        </div>
      ))}
    </div>
  </div>
);

// ============= App =============
const App = () => {
  const { logs, log } = useLogger();

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<><Shortener log={log} /><LoggerPanel logs={logs} /></>} />
          <Route path="/r/:code" element={<Redirect log={log} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
