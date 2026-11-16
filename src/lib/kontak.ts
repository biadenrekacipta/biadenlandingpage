// Satu sumber tautan kontak (site.json) untuk Kontak, Alur, dan form.
export const kontakLinks = (site: { email: string; whatsapp: string }, pesan?: string) => {
  const digits = site.whatsapp.replace(/[\s()+-]/g, '');
  const wa = /^\d{8,15}$/.test(digits) ? `https://wa.me/${digits}${pesan ? `?text=${encodeURIComponent(pesan)}` : ''}` : null;
  const mail = site.email.includes('@')
    ? `mailto:${site.email}${pesan ? `?subject=${encodeURIComponent(pesan)}` : ''}`
    : null;
  return { wa, mail };
};
