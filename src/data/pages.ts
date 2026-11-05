// Every page except the homepage and blog posts is described here as a list of
// sections, rendered by components/Sections.astro. All wording is from visailabs.com.

export type Action = { label: string; href: string };
export type Item = { title?: string; text?: string; image?: string; href?: string; action?: Action };
export type Section =
  | { type: 'hero'; eyebrow?: string; title: string; lede?: string; action?: Action; image: string; wall?: boolean }
  | { type: 'split'; eyebrow?: string; title?: string; paragraphs: string[]; image?: string; flip?: boolean; statement?: boolean }
  | { type: 'statement'; eyebrow?: string; title?: string; text: string }
  | { type: 'features'; eyebrow?: string; title?: string; intro?: string; items: Item[]; numbered?: boolean; columns?: 2 | 3 | 4 }
  | { type: 'video'; eyebrow?: string; title?: string; intro?: string; id: string; points?: string[] }
  | { type: 'videos'; title: string; ids: string[] }
  | { type: 'kit'; title: string; text: string; lists: { title: string; items: string[] }[]; action: Action; images: { image: string; caption: string }[] }
  | { type: 'heading'; eyebrow?: string; title: string; text?: string }
  | { type: 'cta'; title: string; text?: string; action: Action }
  | { type: 'jobs'; title: string; intro: string; positionsTitle: string }
  | { type: 'gallery' }
  | { type: 'posts' }
  | { type: 'prose'; html: string }
  | { type: 'contact'; intro: string[] };

export type Page = { path: string; title: string; description: string; sections: Section[] };

const quote = '/request-quote/';
const contact = '/contact/';
const trial = '/contact/';

const helpCta: Section = {
  type: 'cta',
  title: 'Need help to accelerate your Computer Vision journeys?',
  action: { label: 'Get In Touch', href: contact },
};
const workshopCta: Section = {
  type: 'cta',
  title: 'Know More. Do More.',
  text: 'We offer a free 10-hour product evaluation workshop to help you evaluate how vMeasure can solve your problems and integrate with your current solution.',
  action: { label: 'Request a consultation', href: quote },
};
const why: Section = {
  type: 'video',
  title: 'Why VisAI Labs has Algo Accelerators Rather than an Edge AI Algo Platform?',
  id: '6hmd4izQ81A',
  points: [
    'Unlike Camera and edge processors Algo cannot be built with an one size fits all approach',
    'There are no readily deployable edge AI based Algo platform',
    'All models have to be tuned as per the specific use-case needs',
    'VisAI Labs focuses on creating real world usable commercially viable solutions and not PoCs',
    'The VisAI Algo Accelerators is a carefully curated set of pre-trained Algos which can be tuned as per the needs of the use case within 3-4 weeks.',
  ],
};
const walkthrough: Section = { type: 'video', title: 'The Order Fullfillment Walkthorugh', id: 'MbOrrYD9jng' };
const problem = (what: string): Section => ({
  type: 'cta',
  title: `Is there a problem in incorporating ${what} into your products?`,
  action: { label: 'Get In Touch', href: contact },
});
const contactIntro = [
  'VisAI Labs is the premier edge AI and computer vision product development firm with end to end expertise in helping enterprises create solutions which provide increased productivity with high levels of reliability.',
  'In addition to helping you build solutions, we also have products such as vMeasure Automated Static Parcel Dimensioning system, vTrack – Smart People counter and Viudience – Smart digital signage which can help enterprises adopt AI in these specific use cases faster and integrate them into their core business processes in a seamless fashion.',
  'Contact us with your queries on AI & Computer vision and we will be happy to help',
];
const contactPage = (path: string): Page => ({
  path,
  title: 'Contact - Visai Labs',
  description: 'Feel free to contact us if you have any queries about our products. You can also schedule a call and get in touch with VisAI Labs if necessary.',
  sections: [
    { type: 'hero', title: 'Get in touch', image: 'office-culture' },
    { type: 'contact', intro: contactIntro },
  ],
});

export const pages: Page[] = [
  {
    path: 'about-us',
    title: 'Enriching every vision sensor with actionable insights',
    description: 'At VisAI Labs, We intend to do so by pioneering computer vision and Edge AI research to design industry-specific applications.',
    sections: [
      { type: 'hero', title: 'Who We Are', image: 'photo-for-website', lede: 'VisAI Labs is an India-based Edge AI + Computer Vision company that builds products and solutions where cameras/sensors capture visual data and software turns it into usable “machine-readable” outputs (like measurements, IDs, images/video evidence, and automated checks).' },
      { type: 'split', image: 'Management-People', paragraphs: ['On their own sites, VisAI Labs positions vMeasure (automated dimensioning for warehouses) and vAudit (order/packing video logging tied to order IDs for proof) as part of that broader computer-vision-for-logistics product line.'] },
      { type: 'split', flip: true, title: 'Our Ethos', image: 'Engineering-people', paragraphs: [
        'VisAI Labs who at it’s core are a bunch of Greater fools.',
        'Well, not to sound like Aaron Sorkin, but a greater fool is a person with the perfect combination of arrogance, delusion, obsession and ego who truly believes that he will succeed where others have failed.',
        'The world was built by greater fools, VisAI Labs focuses on building a better, more inclusive world by tackling real world problems which have a direct impact on a vast swathe of humanity.',
      ] },
      { type: 'split', title: 'Our Vision', image: 'Office-culture', paragraphs: [
        'The digital and the physical worlds are converging. Ya, that’s not news.',
        'Whilst the metaverse hopes to bring the physical world into the digital, we at VisAI Labs will bring the digital into the physical.',
        'We truly believe that the right combination of edge AI and computer vision can be used to solve specific problems which when solved will free up mankind’s time from day-to-day drudgery and focus on higher level more fulfilling functions.',
        'In Star Trek, the food replicators freed all sentient life from focusing on the basic wants of life and help the civilizations evolve into something more.',
        'VisAI Labs will be the bunch of greater fools who someday hope to free human beings from the needs and wants of day to day life through building hardware enabled with AI and computer vision to solve specific human problems.',
      ] },
    ],
  },
  {
    path: 'history',
    title: 'VisAI Labs takes Computer Vision where no human has before',
    description: 'VisAI Labs helps build practical and real-world deployable Edge AI and Computer vision solutions to make your firm an AI native enterprise',
    sections: [
      { type: 'hero', title: 'What brought us here', image: 'engineering-people' },
      { type: 'statement', title: 'VisAI Labs was created to deliver a promise that CV has been making to the world for 25+ years', text: 'Along with the increase in the computation power of processors in edge-devices. But the company needed a new dynamic team that could focus and deliver on the promise of revolutionizing day-to-day human life.' },
      helpCta,
    ],
  },
  {
    path: 'vision-mission',
    title: 'Enriching every vision sensor with actionable insights',
    description: 'At VisAI Labs, We intend to do so by pioneering computer vision and Edge AI research to design industry-specific applications.',
    sections: [
      { type: 'hero', title: 'Enriching every vision sensor with intelligence and actionable insights', image: 'occlusion.' },
      { type: 'statement', title: 'Our core objective', text: 'We, at VisAI Labs, want to transform the world with smart vision sensors powered by AI. We intend to do so by being at the forefront of Computer Vision and Edge AI-based research — geared towards building industry-specific applications.' },
      helpCta,
    ],
  },
  contactPage('contact'),
  contactPage('request-quote'),
  {
    path: 'engagement-methodologys',
    title: 'Get end-to-end services for AI-based product development',
    description: 'Collaborate with VisAI Labs to address significant problems and leverage our cutting edge CV and AI-focused engagement methodology',
    sections: [
      { type: 'hero', eyebrow: 'End-to-end, streamlined services', title: 'Complete vision and AI-based edge product development', image: 'group-people-working' },
      { type: 'features', numbered: true, columns: 3, title: 'Why do customers engage with VisAI Labs?', intro: 'Customers engage with VisAI Labs to solve these major problems and leverage our highly-advanced CV and edge AI-focused engagement methodology.', items: [
        { title: 'Add CV and AI capability to existing products' },
        { title: 'Build a new product in a streamlined manner' },
        { title: 'Optimize your AI, ML, and CV algorithms for edge computing' },
      ] },
      { type: 'video', eyebrow: 'The VisAI Labs Engagement Methodology', title: 'How we can increase your product success in the marketplace', id: '1W8OcNrWIhs' },
      helpCta,
    ],
  },
  {
    path: 'edge-ai-cv-services',
    title: 'Edge AI and Computer Vision Product Development Experts- Overview',
    description: "Design, Build, and Deploy Edge AI and Computer vision solutions using VIsAI Lab's expertise across Nvidia Jetson/Deepstream, Intel Movidius and OpenCV Platforms",
    sections: [
      { type: 'hero', title: 'Design, Build, and Deploy Edge AI Solutions', lede: 'Achieve faster GTM for your edge-based product with VisAI Labs’ Algo Accelerators for Face, People and Vehicle Detection', action: { label: 'Contact Us', href: contact }, image: 'automating-queue-management' },
      { type: 'features', numbered: true, title: 'What we offer – Edge AI and CV services', columns: 4, items: [
        { title: 'Identification of the right camera and edge processor' },
        { title: 'AI and Computer Vision algorithm development' },
        { title: 'Porting AI models to edge' },
        { title: 'Accuracy improvement of AI models' },
      ] },
      why,
      problem('Edge AI and Computer vision'),
    ],
  },
  {
    path: 'edge-ai-cv-services/edge-ai-cv-services-face',
    title: 'Edge AI - Face Tracking,Detection, and Recognition solutions on Nvidia Jetson/Deepstream Platform',
    description: 'Edge-based Algorithms for Gender, Age Range & emotion recognition with Face FoV built for Nvidia Jetson/ Deepstream Platform',
    sections: [
      { type: 'hero', title: 'Edge AI Face Tracking,Detection, and Recognition solutions', lede: 'Plugin with Nvidia DeepStream SDK – tunable to major use cases', action: { label: 'Request free trial', href: trial }, image: 'safety-monitoring-face-detection' },
      { type: 'statement', title: 'VisAI Platform – Face Algo Accelerators', text: 'At VisAI Labs, we provide the ultimate trifecta for successful AI solution creation and adoption.' },
      why,
      problem('face tracking, detection, and recognition'),
    ],
  },
  {
    path: 'edge-ai-cv-services/edge-ai-cv-services-people',
    title: 'Edge AI - People Tracking, Detection and Recognition solutions on Nvidia Jetson/Deepstream Platform',
    description: 'Edge-based Algorithms for Gender, Age Range & emotion recognition with People FoV built for Nvidia Jetson/ Deepstream Platform',
    sections: [
      { type: 'hero', eyebrow: 'VisAI Platform – People Algo Accelerators', title: 'Edge AI People Tracking, Detection and Recognition solutions', lede: 'Plugin with Nvidia DeepStream SDK – tunable to major use cases', action: { label: 'Request Free Trail', href: trial }, image: 'people-detection-with-bounding-box' },
      why,
      { type: 'videos', title: 'Watch Vehicle Algo Demo', ids: ['ABt5INrT9jg', 'T_l4YKhS61c', 'Y-MhfL8p71E', 'fK0RJ_pO7TI'] },
      problem('people tracking, detection, and recognition'),
    ],
  },
  {
    path: 'edge-ai-cv-services/edge-ai-cv-services-vehicle',
    title: 'Edge AI - Vehicle Tracking, Detection and Recognition solutions on Nvidia Jetson/Deepstream Platform',
    description: 'Edge based Algorithms for Vehicle line cross counting, Wrong Lane Watch, Average speed and License Plate recognition built for Nvidia Jetson/Deepstream Platform',
    sections: [
      { type: 'hero', eyebrow: 'VisAI Platform – Vehicle Algo Accelerators', title: 'Edge AI Vehicle Tracking, Detection and Recognition solutions', lede: 'Plugin with Nvidia DeepStream SDK – tunable to major use cases', action: { label: 'Request free trial', href: trial }, image: 'automating-parking-registration' },
      why,
      { type: 'videos', title: 'Watch Vehicle Algo Demo', ids: ['KH27tXA_gWI', 'bUBWjr3x6K0', 'fMyxcpZ0qew'] },
      problem('vehicle tracking, detection, and recognition'),
    ],
  },
  {
    path: 'edge-ai-cv-services/edge-ai-cv-services-ready-to-deploy-kits',
    title: 'Accelerate go-to-market with Ready to Deploy PoC kits',
    description: 'Ready to deploy Nvidia Jeston Kits and e-con cameras for building computer vision use cases for indoor and outdoor environments',
    sections: [
      { type: 'hero', title: 'Accelerate go-to-market with Ready to Deploy PoC kits', lede: 'Reduce your PoC development time more than ever before.', image: 'sturdecam_1' },
      { type: 'features', title: 'Start using ready to deploy PoC kits', columns: 4, items: [
        { image: 'e-cam30_cunano', text: 'Nvidia Carrier Boards' },
        { image: 'sturdecam_1', text: 'Ready to Deploy embedded cameras' },
        { image: 'people-detection-with-bounding-box', text: 'Tunable Edge first CV & AI Algorithms' },
        { image: 'nilecam30_tx2', text: 'Choice of Interface (USB, MIPI, GMSL2)' },
      ] },
      { type: 'heading', title: 'Ready to Deploy PoC Kits', text: 'Pre-loaded with your choice of CV algorithms from VisAI Platform' },
      { type: 'kit', title: 'Nvidia Jetson Nano', text: 'Gain inference on the edge and basic CV applications like Face Detection.', action: { label: 'Request Quote', href: quote },
        lists: [{ title: 'Supported cameras for Photon Carrier Board:', items: ['e-CAM50_CUNX – 5MP AR0521-based camera', 'e-CAM30_CUNANO – 3.4MP AR0330-based camera'] }],
        images: [{ image: 'e-CAM50_CUNX', caption: 'e-CAM50_CUNX - 5MP AR0521' }, { image: 'e-CAM30_CUNANO', caption: 'e-CAM30_CUNANO - 3.4MP AR0330' }] },
      { type: 'kit', title: 'Nvidia Xavier', text: 'Deploy advanced applications like multi camera synchronized tracking, sports vision, etc.', action: { label: 'Request Quote', href: quote },
        lists: [{ title: 'Supported cameras for Rogue carrier board:', items: ['e-CAM20_CUXVR – 2MP Sony IMX290-based camera (for Indoor)', 'STURDeCAM20 – 2MP AR0230-based GMSL camera with IP67 enclosure (for Outdoor)', 'NileCAM30 – 3.4MP AR0330-based GMSL camera'] }],
        images: [{ image: 'e-CAM20_CUXVR', caption: 'e-CAM20_CUXVR - 2MP Sony IMX290' }, { image: 'STURDeCAM_1', caption: 'STURDeCAM20 - 2MP AR0230-based GMSL camera' }, { image: 'NileCAM30', caption: 'NileCAM30 - 3.4MP AR0330' }] },
      { type: 'kit', title: 'Nvidia Xavier NX', text: 'Build CV and AI applications like smart surveillance or smart parking lot management.', action: { label: 'Request Quote', href: quote },
        lists: [
          { title: 'Supported cameras for Photon carrier board:', items: ['e-CAM50_CUNX – 2MP5MP AR0521-based camera (for Indoor)'] },
          { title: 'Supported cameras for Rudi NX carrier board:', items: ['STURDeCAM20 – 2MP AR0230-based GMSL camera with IP67 enclosure (for Outdoor)'] },
        ],
        images: [{ image: 'e-CAM50_CUNX', caption: 'e-CAM50_CUNX - 5MP AR0521' }, { image: 'STURDeCAM_1', caption: 'STURDeCAM20 - 2MP AR0230-based GMSL camera' }] },
      { type: 'features', eyebrow: 'Choose from a repository of curated pre-trained and tunable Edge AI algorithms for fast PoC deployments.', title: 'With VisAI Platform, you can choose algorithms across the following functions', columns: 3, items: [
        { title: 'People', href: '/edge-ai-cv-services/edge-ai-cv-services-people/' },
        { title: 'Vehicle', href: '/edge-ai-cv-services/edge-ai-cv-services-vehicle/' },
        { title: 'Face', href: '/edge-ai-cv-services/edge-ai-cv-services-face/' },
      ] },
      { type: 'cta', title: 'Get a PoC up and running within 4 weeks!', action: { label: 'Request Quote', href: quote } },
      { type: 'video', title: 'Factors VisAI Labs consider for building Edge AI Vision Products', id: '1W8OcNrWIhs' },
    ],
  },
  {
    path: 'vmeasure/intralogistics-automation',
    title: 'Automated Dimensioning solution for Inbound and Outbound Logistics',
    description: 'Automated dimensioning systems are used in Inbound and outbound automation esp. in warehouses to make parcel measuring easier',
    sections: [
      { type: 'hero', title: 'Intralogistics Automation Specialists', lede: 'Optimize the flow of goods and information faster with vMeasure', image: 'ith-agv-robotic-arm' },
      { type: 'features', title: 'How does vMeasure help intralogistics automation experts?', columns: 2, items: [
        { title: 'Take a zero-compromise stance on speed', text: 'Ensure rapid flow of goods with quick dimensioning capabilities.' },
        { title: 'Maximize your technology ROI', text: 'Integrate automated dimensioning solutions with low-maintenance needs.' },
        { title: 'Digitally transform to Factory 4.0', text: 'Accelerate Factory 4.0 digital transformation by partnering with an edge AI and dimensioning specialist.' },
        { title: 'Achieve business-critical process automation', text: 'Achieve optimal productivity by automating all your time-intensive and business-critical core processes.' },
      ] },
      { type: 'video', title: 'Why intra-logistics automation solution providers are partnering with VisAI Labs?', id: 'Mj9f5Ur9Pq8' },
      { type: 'features', columns: 2, items: [
        { title: '5 reasons why dimensioning and weighing are MVPs of warehouses', href: 'https://visailabs.com/wp-content/uploads/vMeasure_Parcel-Pro_Brochure.pdf' },
        { title: 'Why Your Warehouses Need Dimensioning And Weighing Solutions In 2021?', text: 'Let’s face it. In the world of warehousing, space = money. Unless you are smart with how you utilize space and effort in your warehouses and fulfillment center operations, you may run into a dead-end.', action: { label: 'Read More', href: '/why-your-warehouses-need-dimensioning-and-weighing-solutions-in-2021/' } },
      ] },
      workshopCta,
    ],
  },
  {
    path: 'vmeasure/logistics-supply-chain-solution-providers',
    title: 'Build and deliver next-gen warehousing solutions',
    description: "Logistics solution providers integrate vMeasure Automated dimensioning system into their solution architecture because of it's easy interfacability and AI prowess.",
    sections: [
      { type: 'hero', title: 'Logistics and Supply Chain Solution Providers', lede: 'Revolutionize your warehouses – with top-notch process consultancy, software recommendation, and implementation', image: 'container-streming' },
      { type: 'features', title: 'How does vMeasure help logistics and supply chain solution providers?', columns: 3, items: [
        { title: 'Get technological know-how - with computer vision and edge-AI for warehouses' },
        { title: 'Leverage the pre-built edge-AI optimized ML and computer vision algorithms' },
        { title: 'Build next-gen solutions and deliver them faster to clients' },
        { title: 'Help evaluate, customize, and manufacture camera offerings to meet futuristic needs' },
        { title: 'Accelerate Factory 4.0 digital transformation – partnering with logistics’ solution providers' },
        { title: 'Get automated dimensioning integration expertise for various warehouse solutions' },
      ] },
      { type: 'video', title: 'How we partner with Logistics and Supply Chain Solution Providers?', id: 'bQO2TRLjcTU' },
      { type: 'features', columns: 2, items: [
        { title: '7 ways logistics providers collaborate with dimensioning specialists to transform the warehouse', text: 'Considering the current COVID-19 situation, cubing or dimensioning solutions have become a game-changer to reduce shipping.', href: 'https://visailabs.com/downloads?whitepaper=Whitepaper_7-ways-logistics-providers-collaborate-with-dimensioning-specialists-to-transform-the-warehouse.pdf' },
        { title: 'How Logistics Providers Can Unlock Dimensioning Power To Transform The Warehouse?', text: 'Warehousing has always been a significant part of logistics. In today’s pandemic climate, with mobility restrictions still in place, there are new norms getting established across the supply chain.', action: { label: 'Read More', href: '/why-your-warehouses-need-dimensioning-and-weighing-solutions-in-2020/' } },
      ] },
      workshopCta,
    ],
  },
  {
    path: 'vmeasure/solution-design-services',
    title: 'vMeasure Solution Design Services- Automated Dimensioning system',
    description: 'Build customized automated dimensioning systems focused on your need and use case to measure parcels in your warehouse instantly',
    sections: [
      { type: 'hero', title: 'vMeasure Solution Design & Integration Services', lede: 'Customize your own automated dimensioning solution', action: { label: 'Contact us now', href: quote }, image: 'pallet-dimension' },
      { type: 'statement', title: 'Solution Design Services', text: 'vMeasure dimensioning solutions, created by VisAI Labs, is a complete end-to-end hardware and software suite capable of handling all major dimensioning needs. With over 20+ years of experience, we understand that each customer is unique and that there is no one-size-fits-all approach to innovation.' },
      { type: 'features', columns: 3, items: [
        { title: 'Custom solution design', text: 'Space constraints, unique environmental conditions, or specific performance asks. VisAI Labs has a team of engineers and to help you build the right solution design' },
        { title: 'Custom software integration', text: 'VisAI Labs provides extensive out-of-the-box software capabilities. We can also build bespoke software applications to meet your unique needs' },
        { title: 'Custom hardware integration', text: 'Integrate hardware and warehouse equipment to vMeasure’s solutions for enhancing dimensioning performance' },
        { title: 'Integration with weighing scales', text: 'Integrate seamlessly, without change to structural integrity of the weighing scale – both static and dynamic weighing' },
        { title: 'Integration with conveyor belts', text: 'Integrate to conveyor belts and completely automate parcel handling, without any changes to flow of the package' },
        { title: 'Intelligent customization', text: 'If you are looking for AI and ML solutions to make sense of your dimensioning data, VisAI Labs has industry experts to provide the right solutions' },
      ] },
      { type: 'features', title: 'Major industries served', columns: 2, items: [
        { image: 'shutterstock_1624560235', title: 'Automated dimensioning solution providers', text: 'AD solution providers can use VisAI Labs and vMeasure team’s CV expertise to develop new solutions and product offerings' },
        { image: 'shutterstock_667250779', title: 'Logistics solution providers', text: 'VisAI Labs works together with logistics solution providers during tenders to manage solution design for Factory 4.0 digital transformation projects' },
      ] },
      walkthrough,
      workshopCta,
    ],
  },
  {
    path: 'vmeasure/ai-enabled-dimensioning-add-ons',
    title: 'vMeasure AI-Enabled - Automated Parcel Dimensioning systems',
    description: 'vMeasure AI-enabled Dimensioning Add-ons for Automated dimensioning systems enabling open/broken box detection and backage optimization',
    sections: [
      { type: 'hero', eyebrow: 'AI Enablement', title: 'vMeasure AI-enabled Dimensioning Add-ons', lede: 'Adding intelligence is the next evolutionary step in automated dimensioning – vMeasure Intelligent SDKs are the initiators and forerunners of this evolution', image: 'ecommer_gamechanger' },
      { type: 'features', title: 'The next big thing in automated dimensioning for warehouses', columns: 3, items: [
        { title: 'Massive upsurge in e-commerce orders' },
        { title: 'Direct freight movement from the warehouse to the end-customer' },
        { title: 'Increase in freight volume — but value per freight/parcel has drastically reduced' },
        { title: 'Rising warehousing real estate costs' },
        { title: 'Increasing labor costs that are unexpected' },
        { title: 'Managing high volumes of customer SLAs' },
      ] },
      { type: 'heading', title: 'Intelligent Dimensioning AI Enablement offerings' },
      { type: 'split', eyebrow: 'vMeasure Products compatible with AI Add-ons', image: 'why-modern-warehouses', paragraphs: ['Parcel Pro S100 – Put certainty and efficiency back in your freight charges'], statement: true },
      workshopCta,
    ],
  },
  {
    path: 'vmeasure/dimensioning-integration-services',
    title: 'Integrate intelligence with any type of warehouse solution',
    description: 'vMeasure Automated Dimensioning range of solutions can integrate with conveyors, forklifts, barcode scanners and all major ERP/WMS systems',
    sections: [
      { type: 'hero', title: 'vMeasure Dimension Integration Services', lede: 'Integrate intelligence with all your major warehouse hardware and software solutions', action: { label: 'Contact us now', href: quote }, image: 'interior-warehouse-logistic' },
      { type: 'heading', title: 'vMeasure offers a multitude of integration services for the vMeasure dimensioning product and solution suite.' },
      { type: 'split', title: 'Conveyor belts', image: 'shutterstock_1468587050', paragraphs: ['vMeasure products can be integrated with in-motion systems.', 'Easily mountable at all major angles', '<1 second dimensioning allows for fast dimensioning', 'No manual oversight as automatic triggering for dimensioning occurs', 'AI-enabled dimensioning add-ons for faster processing of parcels'] },
      { type: 'split', flip: true, title: 'Weighing scales', image: 'shutterstock_1624560235', paragraphs: ['Integrate seamlessly, without change to structural integrity of the weighing scale', 'Both static and dynamic weighing', 'AI-enabled dimensioning add-ons for faster processing of parcels'] },
      { type: 'split', title: 'Forklifts', image: 'shutterstock_1456511291', paragraphs: ['Easily mountable at all major angles', '<1 second dimensioning allows for fast dimensioning', 'No manual oversight as automatic triggering for dimensioning occurs', 'AI enabled Dimensioning Add-ons for faster processing of parcels'] },
      walkthrough,
      workshopCta,
    ],
  },
  {
    path: 'careers',
    title: 'Enriching every vision sensor with actionable insights',
    description: 'At VisAI Labs, We intend to do so by pioneering computer vision and Edge AI research to design industry-specific applications.',
    sections: [
      { type: 'hero', eyebrow: 'Careers', title: 'Build the next-gen tech with us!', image: 'management-people' },
      { type: 'jobs', title: 'Careers', positionsTitle: 'Positions and Eligibility:', intro: 'We at VisAI Labs are geared towards bracing up the challenges in product development and relish in devising innovative techniques to overcome the wide spectrum of challenges within a set of constraints. Our passion towards product development and pursuit of excellence in engineering has created a unique place for visAI in our industry!!! If you have the same passion and dreaming of bringing in your own product to the market place, apply for the suitable position.' },
    ],
  },
  {
    path: 'life-at-visai',
    title: 'Enriching every vision sensor with actionable insights',
    description: 'At VisAI Labs, We intend to do so by pioneering computer vision and Edge AI research to design industry-specific applications.',
    sections: [
      { type: 'hero', title: 'Personnel Playdays', image: '5-min', wall: true },
      { type: 'gallery' },
      { type: 'videos', title: 'A glimpse of our exciting work life!', ids: ['3r9ioprPsx4', '6CKinNXXZ7I', 'hbGDb7kxoWA', 'zz9K1zHBNg8'] },
    ],
  },
  {
    path: 'whitepapers',
    title: 'Welcome to a new world of Edge AI and Computer Vision-Whitepaper',
    description: 'Through the VisAI Labs Whitepaper, we build and help companies to construct deployable Edge-AI based computer vision solutions.',
    sections: [{ type: 'hero', title: 'Whitepapers', image: 'warehouse-process' }, helpCta],
  },
  {
    path: 'podcasts',
    title: 'unravelling computer vision and edge-ai for the real world-Podcast',
    description: 'In this podcast series of unravelling computer vision and Edge AI for the real world, we will discuss solving the use cases of Edge-based computer vision solutions.',
    sections: [{ type: 'hero', eyebrow: 'Edge AI and Computer Vision', title: 'Podcasts', image: 'mining.' }, helpCta],
  },
  {
    path: 'webinar',
    title: 'Edge AI and Computer Vision Product Development Experts- Webinar',
    description: 'Through the VisAI Labs webinar, we build and help companies construct deployable Edge-based computer vision solutions.',
    sections: [{ type: 'hero', eyebrow: 'On-Demand Webinars', title: 'Webinar', image: 'motp.' }, helpCta],
  },
  {
    path: 'blog',
    title: 'Blog - Visai labs',
    description: 'Find out blogs on automate parcel dimensioning system, people/human detection solution based on a real-time use cases.',
    sections: [{ type: 'hero', title: 'VisAI Blog', image: 'warehouse-industry' }, { type: 'posts' }, helpCta],
  },
];
