'use client';

import { Twitter, Linkedin, Link2, Facebook, Send, Mail } from 'lucide-react';
import { useState } from 'react';

export default function ShareButtons({ title }) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
    const shareTitle = encodeURIComponent(title);

    const shareLinks = [
        {
            name: 'Twitter / X',
            icon: Twitter,
            href: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
            color: 'hover:bg-black hover:text-white',
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            href: `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`,
            color: 'hover:bg-[#0077B5] hover:text-white',
        },
        {
            name: 'Facebook',
            icon: Facebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
            color: 'hover:bg-[#1877F2] hover:text-white',
        },
        {
            name: 'Reddit',
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                </svg>
            ),
            href: `https://reddit.com/submit?url=${shareUrl}&title=${shareTitle}`,
            color: 'hover:bg-[#FF4500] hover:text-white',
        },
        {
            name: 'WhatsApp',
            icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            ),
            href: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
            color: 'hover:bg-[#25D366] hover:text-white',
        },
        {
            name: 'Telegram',
            icon: Send,
            href: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`,
            color: 'hover:bg-[#0088cc] hover:text-white',
        },
        {
            name: 'Email',
            icon: Mail,
            href: `mailto:?subject=${shareTitle}&body=Check out this article: ${shareUrl}`,
            color: 'hover:bg-zinc-700 hover:text-white',
        },
    ];

    return (
        <div className="mt-12 pt-8 border-t">
            <p className="text-sm font-medium text-zinc-900 mb-4">Share this article</p>
            <div className="flex flex-wrap items-center gap-2">
                {shareLinks.map((link, i) => (
                    <a
                        key={i}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link.name}
                        className={`w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 transition-all ${link.color}`}
                    >
                        <link.icon className="w-4 h-4" />
                    </a>
                ))}
                <button
                    onClick={handleCopyLink}
                    className={`h-10 px-4 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                        }`}
                    title="Copy link"
                >
                    <Link2 className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy Link'}
                </button>
            </div>
        </div>
    );
}
