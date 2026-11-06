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

/** Navbar. `icon` is a key from components/react/icons.tsx. */
export const navbar = {
  products: {
    label: 'Products',
    groups: [
      {
        name: 'vMeasure',
        tagline: 'Dimensioning systems',
        href: 'https://vmeasure.ai/',
        items: [
          { label: 'Parcel Dimensioners', desc: 'Dimensions, weight and images of parcels in seconds.', icon: 'parcel', href: 'https://vmeasure.ai/dimensioning-systems/' },
          { label: 'Pallet Dimensioners', desc: 'Accurate measurement of pallets and irregular freight.', icon: 'pallet', href: 'https://vmeasure.ai/pallet-dimensioner/' },
          { label: 'In-motion Dimensioner', desc: 'Measures parcels as they travel along the conveyor.', icon: 'motion', href: 'https://vmeasure.ai/dimensional-scanner/' },
          { label: 'Mobile Dimensioner', desc: 'Dimensioning on the go, from a mobile device.', icon: 'mobile', href: 'https://vmeasure.ai/mobile-dimensioning/' },
        ],
      },
      {
        name: 'vAudit',
        tagline: 'Packing video verification',
        href: 'https://vaudit.ai/',
        items: [
          { label: 'Video Logger', desc: 'Video proof of packing, linked to each order ID.', icon: 'video', href: 'https://vaudit.ai/packing-video-recording-system/' },
          { label: 'Order Verification', desc: 'Order checks at the pack station, on record.', icon: 'verify', href: 'https://vaudit.ai/order-verification-system/' },
          { label: 'Returns Processing', desc: 'Returns inspection on video, linked to the return ID.', icon: 'returns', href: 'https://vaudit.ai/returns-management-software/' },
        ],
      },
    ],
  },
  links: [
    { label: 'Resources', href: '/blog/' },
    { label: 'Company', href: '/about-us/' },
    { label: 'Careers', href: '/careers/' },
    { label: 'Life at VisAI', href: '/life-at-visai/' },
  ],
  cta: { label: 'Book a Demo', href: '/contact/' },
};
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

/** Homepage hero wording. The measurement values are in ScanAnimation.tsx. */
export const homeHero = {
  before: 'Building',
  highlight: 'Physical AI',
  after: 'Solutions with Advanced Computer Vision',
  sub: 'Built for real-world warehouse and logistics operations. Focused on dimensioning accuracy and pack station visibility.',
  primary: { label: 'Explore vMeasure', href: 'https://vmeasure.ai/' },
  secondary: { label: 'Explore vAudit', href: 'https://vaudit.ai/' },
  trust: ['Founded 2018', 'SOC 2 compliant cloud', 'In-house hardware + software'],
  cue: 'Scroll to explore',
};

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
