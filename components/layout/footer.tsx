'use client';
import { useTenant } from '@/app/providers/TenantProvider';
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  Send,
  ShieldCheck,
  Truck,
  CreditCard,
} from "lucide-react";

export function Footer() {
  const tenant = useTenant();
  const appName = tenant?.branding?.app_name || "{appName}";
  const website = tenant?.settings?.website_url;
  return (
    <footer className="mt-20 border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white">

      {/* TRUST BAR */}
      <div className="border-b border-slate-200">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-3">

          <div className="flex items-center gap-3">
            <Truck className="text-[#127D61]" />
            <div>
              <p className="font-bold text-slate-900">Fast delivery</p>
              <p className="text-sm text-slate-500">Reliable shipping across Uganda</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#127D61]" />
            <div>
              <p className="font-bold text-slate-900">Secure shopping</p>
              <p className="text-sm text-slate-500">Your payments are protected</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="text-[#127D61]" />
            <div>
              <p className="font-bold text-slate-900">Flexible payments</p>
              <p className="text-sm text-slate-500">Multiple payment options available</p>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN FOOTER */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">

        {/* BRAND */}
        <div>
          <p className="text-2xl font-black text-slate-900">GoCart</p>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            GoCart is a modern ecommerce platform designed to help customers
            discover products, shop easily, and receive deliveries with speed
            and reliability.
          </p>

          {/* SOCIAL */}
          <div className="mt-5 flex flex-wrap gap-3">
            <SocialIcon href="https://www.facebook.com/niwahae" icon={<Facebook size={18} />} />
            <SocialIcon href="https://twitter.com/edwinniwaha" icon={<Twitter size={18} />} />
            <SocialIcon href="https://instagram.com/niwaha_edwin" icon={<Instagram size={18} />} />
            <SocialIcon href="https://www.linkedin.com/in/edwin-niwaha-155089100/" icon={<Linkedin size={18} />} />
            <SocialIcon href="https://github.com/edwin-niwaha" icon={<Github size={18} />} />
          </div>
        </div>

        {/* SHOP */}
        <FooterSection title="Shop">
          <FooterLink href="/products">All Products</FooterLink>
          <FooterLink href="/categories">Browse Categories</FooterLink>
          <FooterLink href="/cart">Shopping Cart</FooterLink>
          <FooterLink href="/wishlist">Wishlist</FooterLink>
        </FooterSection>

        {/* CUSTOMER */}
        <FooterSection title="Customer">
          <FooterLink href="/account/orders">My Orders</FooterLink>
          <FooterLink href="/account/addresses">Shipping Addresses</FooterLink>
          <FooterLink href="/account/payments">Payments</FooterLink>
          <FooterLink href="/account/notifications">Notifications</FooterLink>
        </FooterSection>

        {/* CONTACT + NEWSLETTER */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
            Contact
          </h3>

          <div className="mt-4 space-y-3 text-sm text-slate-600">

            <a href="tel:+256700000000" className="flex items-center gap-2 hover:text-[#127D61]">
              <Phone size={16} />
              +256 700 000 000
            </a>

            <a href="mailto:hello@gocart.store" className="flex items-center gap-2 hover:text-[#127D61]">
              <Mail size={16} />
              hello@gocart.store
            </a>

            <div className="flex items-center gap-2">
              <MapPin size={16} />
              Kampala, Uganda
            </div>

            <Link href="/cart" className="flex items-center gap-2 hover:text-[#127D61]">
              <ShoppingCart size={16} />
              View Cart
            </Link>

          </div>

          {/* NEWSLETTER */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">
              Subscribe to updates
            </p>

            <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200">
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-3 py-2 text-sm outline-none"
              />
              <button className="bg-[#127D61] px-3 text-white">
                <Send size={16} />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Get product updates and exclusive offers.
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">

          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-slate-700">Perpetual Labs</span>. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-[#127D61]">
              Privacy Policy
            </Link>

            <Link href="/terms" className="hover:text-[#127D61]">
              Terms of Service
            </Link>

            <Link href="/support" className="hover:text-[#127D61]">
              Support
            </Link>
          </div>

        </div>
      </div>
    {website ? <a href={website} className="text-sm text-slate-500 underline">Website</a> : null}</footer>
  );
}

/* COMPONENTS */

function FooterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
        {title}
      </h3>

      <div className="mt-4 space-y-3 text-sm text-slate-600">
        {children}
      </div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="block transition hover:text-[#127D61]">
      {children}
    </Link>
  );
}

function SocialIcon({
  href,
  icon,
}: {
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-[#127D61]"
    >
      {icon}
    </a>
  );
}