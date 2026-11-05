// Navigation, footer, contact details and shared wording: all from visailabs.com.

export const site = {
  name: 'VisAI Labs',
  tagline:
    'VisAI Labs uses AI + Vision to solve real-world problems for humans and aims to become one of the world’s largest Edge-AI and Computer Vision Solution Providers.',
  rights: '© All rights reserved',
  logo: 'Visai-Labs-Dimensioner',
  // Set PUBLIC_FORM_ENDPOINT in .env to post forms to a server; otherwise they open an email.
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT as string | undefined,
  formEmail: 'sales@visailabs.com',
};

type Link = { label: string; href: string };
type NavGroup = { title?: Link; links: Link[] };

export const nav: { label: string; groups: NavGroup[] }[] = [
  {
    label: 'Products',
    groups: [
      {
        title: { label: 'vMeasure', href: 'https://vmeasure.ai/' },
        links: [
          { label: 'Parcel Dimensioners', href: 'https://vmeasure.ai/dimensioning-systems/' },
          { label: 'Pallet Dimensioners', href: 'https://vmeasure.ai/pallet-dimensioner/' },
          { label: 'In-motion Dimensioner', href: 'https://vmeasure.ai/dimensional-scanner/' },
          { label: 'Mobile Dimensioner', href: 'https://vmeasure.ai/mobile-dimensioning/' },
        ],
      },
      {
        title: { label: 'vAudit', href: 'https://vaudit.ai/' },
        links: [
          { label: 'vAudit Video Logger', href: 'https://vaudit.ai/packing-video-recording-system/' },
          { label: 'vAudit Order Verification', href: 'https://vaudit.ai/order-verification-system/' },
          { label: 'vAudit Returns Processing', href: 'https://vaudit.ai/returns-management-software/' },
        ],
      },
    ],
  },
  { label: 'Resources', groups: [{ links: [{ label: 'Blog', href: '/blog/' }] }] },
  {
    label: 'Company',
    groups: [
      {
        links: [
          { label: 'About VisAI Labs', href: '/about-us/' },
          { label: 'Contact', href: '/contact/' },
          { label: 'Careers', href: '/careers/' },
          { label: 'Life at VisAI', href: '/life-at-visai/' },
        ],
      },
    ],
  },
];
export const empLogin = { label: 'Emp Login', href: 'https://hrmax.myadrenalin.com/azureauth/' };

export const footer = [
  {
    title: 'Edge AI & CV',
    links: [
      { label: 'Overview', href: '/edge-ai-cv-services/' },
      { label: 'Face', href: '/edge-ai-cv-services/edge-ai-cv-services-face/' },
      { label: 'People', href: '/edge-ai-cv-services/edge-ai-cv-services-people/' },
      { label: 'Vehicle', href: '/edge-ai-cv-services/edge-ai-cv-services-vehicle/' },
      { label: 'Ready to Deploy Kits', href: '/edge-ai-cv-services/edge-ai-cv-services-ready-to-deploy-kits/' },
    ],
  },
  {
    title: 'Products',
    links: [
      { label: 'vMeasure Dimensioning System', href: 'https://vmeasure.ai/' },
      { label: 'vMeasure Pallet Dimensioner', href: 'https://vmeasure.ai/pallet-dimensioner/' },
    ],
  },
  { title: 'Resources', links: [{ label: 'Blog', href: '/blog/' }] },
  {
    title: 'About',
    links: [
      { label: 'History', href: '/history/' },
      { label: 'Vision & Mission', href: '/vision-mission/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
];
export const social = [
  { label: 'Linkedin', href: 'https://www.linkedin.com/company/visailabs' },
  { label: 'Youtube', href: 'https://www.youtube.com/channel/UCEhSbUinD5jU5l0z_K0Hc7w' },
];
export const legal = [
  { label: 'Privacy Policy', href: '/privacy-policy/' },
  { label: 'Sitemap', href: '/sitemap-index.xml' },
];

/** Interface words the original never spells out. Kept together for easy review. */
export const ui = {
  menu: 'Menu',
  skip: 'Skip to content',
  play: 'Play',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  sent: 'Thank you.',
  notFoundTitle: '404',
  notFoundBack: 'Home',
};

export const contact = {
  sales: {
    title: 'Sales Office Centre:',
    address: '3340 Walnut Avenue, Suite #280,Fremont, CA 94538.',
    phone: '+1 716 452 9940',
    tel: '+17164529940',
  },
  dev: {
    title: 'Development Centre:',
    address: 'Unit 55 and 56, SDF-1, MEPZ SEZ, Tambaram, Chennai - 600 045, India',
    phone: '044-69055604',
    tel: '04469055604',
  },
  hours: '(Available Monday to Friday, between 10:00 AM and 7:00 PM IST)',
  enquiries: {
    title: 'For Enquiries:',
    lines: [
      { label: 'Career Opportunities:', email: 'careers@visailabs.com' },
      { label: 'Product:', email: 'sales@visailabs.com' },
    ],
  },
  form: {
    fields: [
      { name: 'name', label: 'Name*', type: 'text', required: true },
      { name: 'email', label: 'Email*', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number*', type: 'tel', required: true },
      { name: 'company', label: 'Company*', type: 'text', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: false },
    ],
    submit: 'Submit',
  },
};
