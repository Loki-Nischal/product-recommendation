import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Mail, Facebook, Instagram,
  MapPin, Send, MessageCircle, ChevronRight,
} from 'lucide-react';

// ── Social / contact data ─────────────────────────────────────────────────────
const CONTACT_INFO = [
  {
    id: 'phone',
    icon: <Phone size={22} className="text-blue-600" />,
    label: 'Phone',
    value: '+977 9810108166',
    href: 'tel:+9779810108166',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    hoverBorder: 'hover:border-blue-400',
  },
  {
    id: 'email',
    icon: <Mail size={22} className="text-purple-600" />,
    label: 'Email',
    value: 'budhathoki.nischal@gmail.com',
    href: 'mailto:budhathoki.nischal@gmail.com',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    hoverBorder: 'hover:border-purple-400',
  },
  {
    id: 'facebook',
    icon: <Facebook size={22} className="text-[#1877F2]" />,
    label: 'Facebook',
    value: 'Sailendra Rawal',
    href: 'https://facebook.com/sailendrarawal',
    bg: 'bg-[#e7f0fd]',
    border: 'border-[#b3d0f7]',
    hoverBorder: 'hover:border-[#1877F2]',
  },
  {
    id: 'instagram',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ig-grad" cx="30%" cy="107%" r="130%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
        <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
      </svg>
    ),
    label: 'Instagram',
    value: '@Nischal Budhathoki',
    href: 'https://instagram.com/nischalbudhathoki',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    hoverBorder: 'hover:border-pink-400',
  },
];

// ── Contact Card ──────────────────────────────────────────────────────────────
const ContactCard = ({ icon, label, value, href, bg, border, hoverBorder }) => (
  <a
    href={href}
    target={href.startsWith('http') ? '_blank' : undefined}
    rel="noopener noreferrer"
    className={`flex items-center gap-4 p-5 rounded-2xl border ${bg} ${border} ${hoverBorder} transition-all duration-200 group shadow-sm hover:shadow-md`}
  >
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0 shadow-inner`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition truncate">{value}</p>
    </div>
    <ChevronRight size={16} className="ml-auto text-gray-400 group-hover:text-blue-500 shrink-0 transition" />
  </a>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    // Build a mailto link as a simple no-backend contact method
    const subject = encodeURIComponent(`MyStore enquiry from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.open(`mailto:budhathoki.nischal@gmail.com?subject=${subject}&body=${body}`);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <MessageCircle size={14} />
            We're always here to help
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 leading-tight">
            Get In Touch
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            Have a question, suggestion, or just want to say hi?
            Reach out through any of the channels below — we typically respond within 24 hours.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14 space-y-14">

        {/* ── Contact Info Cards ── */}
        <section>
          <h2 className="text-xl font-extrabold text-gray-800 mb-6">Contact Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CONTACT_INFO.map((c) => (
              <ContactCard key={c.id} {...c} />
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400 font-medium">or send a message</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ── Message Form ── */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
              <Send size={20} className="text-blue-600" /> Send a Message
            </h2>

            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Send size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Message Prepared!</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Your email client opened with your message. Hit <strong>Send</strong> there to complete.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Your Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Message
                  </label>
                  <textarea
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Write your message here…"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow"
                >
                  <Send size={16} /> Send Message
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── Back to Home ── */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 text-sm font-semibold hover:underline"
          >
            ← Back to Home
          </Link>
        </div>

      </div>

      {/* ── Footer strip ── */}
      <div className="bg-white border-t py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} MyStore · Built with ❤️ in Nepal
      </div>
    </div>
  );
};

export default ContactPage;
