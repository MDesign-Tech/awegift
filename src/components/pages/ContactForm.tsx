"use client";

import { useState, type FormEvent } from "react";

const fieldClass = "w-full px-4 py-3 border border-border-color rounded-lg focus:ring-2 focus:ring-theme-color focus:border-transparent outline-none transition-colors";

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not send your message. Please try again.");
      setSuccess(result.message || "Your message has been received.");
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return <>
    <form className="space-y-6" onSubmit={submit}>
      <div><label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-700">Full Name *</label><input type="text" id="fullName" name="fullName" required minLength={2} maxLength={160} autoComplete="name" className={fieldClass} placeholder="Your full name" /></div>
      <div><label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">Email Address *</label><input type="email" id="email" name="email" required maxLength={254} autoComplete="email" className={fieldClass} placeholder="your.email@example.com" /></div>
      <div><label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">Phone Number <span className="font-normal text-gray-500">(optional)</span></label><input type="tel" id="phone" name="phone" maxLength={32} autoComplete="tel" className={fieldClass} placeholder="Your phone number" /></div>
      <div><label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-700">Subject *</label><input type="text" id="subject" name="subject" required minLength={2} maxLength={160} className={fieldClass} placeholder="How can we help?" /></div>
      <div><label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-700">Message *</label><textarea id="message" name="message" required minLength={10} maxLength={5000} rows={6} className={fieldClass+" resize-y"} placeholder="Tell us how we can help you..." /></div>
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      {error&&<p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success&&<p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</p>}
      <button type="submit" disabled={sending} className="w-full rounded-lg bg-theme-color px-6 py-3 font-medium text-theme-white transition-colors duration-200 hover:bg-theme-color/90 disabled:cursor-wait disabled:opacity-60">{sending?"Sending…":"Send Message"}</button>
    </form>
  </>;
}
