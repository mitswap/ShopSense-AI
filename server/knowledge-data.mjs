/** Bangladesh SME apparel knowledge - seeded into Supabase pgvector */
export const KNOWLEDGE_SEED = [
  {
    id: 'kb-001',
    category: 'seasonal',
    content:
      'Eid-ul-Fitr drives 40-70% spike in panjabi, saree, and kids wear in Bangladesh apparel retail.',
    content_bn:
      'ঈদুল ফিতরের আগে বাংলাদেশি পোশাকের দোকানে পাঞ্জাবি, শাড়ি এবং শিশুদের পোশাকের চাহিদা সাধারণত ৪০-৭০% পর্যন্ত বেড়ে যায়। তাই ঈদের ২-৩ সপ্তাহ আগে এসব পণ্যের স্টক বাড়ানো উচিত।',
  },
  {
    id: 'kb-002',
    category: 'seasonal',
    content:
      'Durga Puja increases demand for sarees and traditional wear in October-November, especially in mixed family shopping areas.',
    content_bn:
      'দুর্গাপূজার সময়ে অক্টোবর-নভেম্বরে শাড়ি ও ঐতিহ্যবাহী পোশাকের চাহিদা বেড়ে যায়, বিশেষ করে পরিবারভিত্তিক কেনাকাটার এলাকাগুলোতে।',
  },
  {
    id: 'kb-003',
    category: 'weather',
    content:
      'Heavy monsoon rain reduces footfall 15-25%; promote slow movers with discounts and protect cash from overbuying.',
    content_bn:
      'ভারী বর্ষায় দোকানে ক্রেতা আসা ১৫-২৫% পর্যন্ত কমে যেতে পারে। এ সময়ে ধীরগতির পণ্যে ছাড় দিন এবং অতিরিক্ত কেনাকাটা থেকে নগদ অর্থ বাঁচান।',
  },
  {
    id: 'kb-004',
    category: 'inventory',
    content:
      'Reorder when days-of-cover falls below 14 days before major festivals, and below 10 days during normal weeks for fast movers.',
    content_bn:
      'বড় উৎসবের আগে কোনো ফাস্ট মুভার পণ্যের স্টক কভার ১৪ দিনের নিচে নামলে রি-অর্ডার দিন। স্বাভাবিক সপ্তাহে ফাস্ট মুভারের ক্ষেত্রে ১০ দিনের নিচে নামলেও ব্যবস্থা নেওয়া উচিত।',
  },
  {
    id: 'kb-005',
    category: 'inventory',
    content:
      'Slow movers over 90 days tie up cash; discount 10-15% or bundle with fast movers instead of buying fresh stock in that category.',
    content_bn:
      '৯০ দিনের বেশি সময় ধরে না চলা পণ্য নগদ অর্থ আটকে রাখে। তাই ১০-১৫% ছাড় দিন বা ফাস্ট মুভারের সঙ্গে বান্ডেল করুন, কিন্তু ওই ক্যাটাগরিতে নতুন স্টক তাড়াহুড়ো করে আনবেন না।',
  },
  {
    id: 'kb-006',
    category: 'winter',
    content:
      'November-January usually increases hoodie, sweater, and shawl sales in urban Bangladesh, but demand fades quickly after cold waves end.',
    content_bn:
      'নভেম্বর থেকে জানুয়ারি পর্যন্ত শহুরে বাংলাদেশে হুডি, সোয়েটার এবং শালের বিক্রি সাধারণত বাড়ে, তবে শীত কমে গেলে এই চাহিদা দ্রুত নেমে আসতে পারে।',
  },
  {
    id: 'kb-007',
    category: 'sme',
    content:
      'Bangladesh SME apparel shops often start with notebooks; digitizing CSV sales and stock records makes forecasting and reorder planning practical.',
    content_bn:
      'বাংলাদেশের অনেক ক্ষুদ্র পোশাকের দোকান খাতাভিত্তিক হিসাব দিয়ে শুরু করে। বিক্রি ও স্টকের তথ্য CSV-তে আনা হলে ফোরকাস্টিং এবং রি-অর্ডার পরিকল্পনা অনেক বেশি বাস্তবসম্মত হয়।',
  },
  {
    id: 'kb-008',
    category: 'kpi',
    content:
      'Track stock-out risk, dead stock value, gross margin, and 30-day revenue together; revenue alone can hide weak inventory quality.',
    content_bn:
      'স্টক-আউট ঝুঁকি, ডেড স্টক ভ্যালু, গ্রস মার্জিন এবং ৩০ দিনের বিক্রি একসঙ্গে ট্র্যাক করুন। শুধু রাজস্ব দেখলে ইনভেন্টরির দুর্বলতা আড়ালে থেকে যেতে পারে।',
  },
]

export const APPAREL_KNOWLEDGE_CHUNKS = [
  {
    id: 'kb-009',
    category: 'pricing',
    content:
      'If a product sells at least 70% of its opening stock within 14 days without discount, the price is probably too low and can often be increased 3-5% without harming demand.',
    content_bn:
      'কোনো পণ্য যদি ১৪ দিনের মধ্যে শুরুর স্টকের অন্তত ৭০% ছাড় ছাড়া বিক্রি হয়ে যায়, তাহলে ধরে নেওয়া যায় দাম কিছুটা কম রাখা হয়েছে। এ ক্ষেত্রে ৩-৫% দাম বাড়ালেও অনেক সময় চাহিদা খুব একটা কমে না।',
  },
  {
    id: 'kb-010',
    category: 'pricing',
    content:
      'If weekly sales fall more than 20% after a price increase and nearby substitutes remain available, reverse the increase quickly instead of waiting a full month.',
    content_bn:
      'দাম বাড়ানোর পর যদি সাপ্তাহিক বিক্রি ২০% এর বেশি কমে যায় এবং বিকল্প পণ্য বাজারে থাকে, তাহলে পুরো মাস অপেক্ষা না করে দ্রুত দাম পুনর্বিবেচনা করা উচিত।',
  },
  {
    id: 'kb-011',
    category: 'pricing',
    content:
      'Entry-price items should usually keep gross margin above 18%; using low-price hero products below that level should be limited to a small traffic-driving set.',
    content_bn:
      'এন্ট্রি-প্রাইস পণ্যে সাধারণত গ্রস মার্জিন ১৮% এর উপরে রাখা উচিত। এর নিচে কমদামের হিরো পণ্য রাখা গেলে সেটি খুব সীমিত ট্রাফিক-ড্রাইভিং সেটের মধ্যে রাখা ভালো।',
  },
  {
    id: 'kb-012',
    category: 'pricing',
    content:
      'Premium festive wear can carry 25-40% higher margin than daily basics when display quality, packaging, and social demand are strong.',
    content_bn:
      'ডিসপ্লে, প্যাকেজিং এবং সামাজিক চাহিদা শক্তিশালী হলে প্রিমিয়াম উৎসবের পোশাকে দৈনন্দিন বেসিক পণ্যের তুলনায় ২৫-৪০% বেশি মার্জিন রাখা যায়।',
  },
  {
    id: 'kb-013',
    category: 'pricing',
    content:
      'When the same SKU stays unsold for 45 days, test a 5% markdown first; deep 20% markdowns should be a later step, not the first step.',
    content_bn:
      'একই SKU ৪৫ দিন বিক্রি না হলে প্রথমে ৫% মার্কডাউন পরীক্ষা করুন। শুরুতেই ২০% এর মতো বড় ছাড় দেওয়া ঠিক নয়।',
  },
  {
    id: 'kb-014',
    category: 'bundling',
    content:
      'Pair a fast-moving panjabi or shirt with a slower pajama, legging, or scarf so the bundle clears inventory without visibly discounting the hero item.',
    content_bn:
      'ফাস্ট মুভিং পাঞ্জাবি বা শার্টের সঙ্গে ধীরগতির পায়জামা, লেগিংস বা স্কার্ফ জুড়ে দিন, যাতে হিরো পণ্যের মান কমিয়ে না দেখিয়ে ইনভেন্টরি ক্লিয়ার করা যায়।',
  },
  {
    id: 'kb-015',
    category: 'bundling',
    content:
      'Bundles work best when the second item is 20-35% of the hero item price; if the add-on is too expensive, conversion usually drops.',
    content_bn:
      'বান্ডেল সবচেয়ে ভালো কাজ করে যখন দ্বিতীয় পণ্যের দাম হিরো পণ্যের দামের ২০-৩৫% এর মধ্যে থাকে। অতিরিক্ত পণ্য বেশি দামী হলে কনভার্সন সাধারণত কমে যায়।',
  },
  {
    id: 'kb-016',
    category: 'bundling',
    content:
      'Offer family bundles before Eid and Puja because multi-item buying rises during gift and occasion shopping weeks.',
    content_bn:
      'ঈদ ও পূজার আগে ফ্যামিলি বান্ডেল দিন, কারণ উপহার এবং বিশেষ উপলক্ষের কেনাকাটার সময়ে একসঙ্গে একাধিক পণ্য কেনার প্রবণতা বেড়ে যায়।',
  },
  {
    id: 'kb-017',
    category: 'seasonal',
    content:
      'Summer cotton basics usually accelerate from March through June; stock breathable colors and light sizes before heat peaks.',
    content_bn:
      'মার্চ থেকে জুন পর্যন্ত গরমের কটন বেসিক পণ্যের চাহিদা সাধারণত বাড়ে। তাপমাত্রা চূড়ায় ওঠার আগে হালকা রং এবং আরামদায়ক সাইজের স্টক প্রস্তুত রাখুন।',
  },
  {
    id: 'kb-018',
    category: 'seasonal',
    content:
      'Rain-friendly apparel and quick-dry home wear can rise 10-18% during peak monsoon in dense neighborhood markets.',
    content_bn:
      'ঘনবসতিপূর্ণ লোকাল মার্কেটে বর্ষার চূড়ান্ত সময়ে বৃষ্টিবান্ধব পোশাক এবং দ্রুত শুকায় এমন হোমওয়্যারের চাহিদা ১০-১৮% পর্যন্ত বাড়তে পারে।',
  },
  {
    id: 'kb-019',
    category: 'seasonal',
    content:
      'Back-to-school shopping weeks increase kids basics, socks, undershirts, and low-ticket essentials even when premium categories stay flat.',
    content_bn:
      'স্কুল খোলার সময় শিশুদের বেসিক পোশাক, মোজা, আন্ডারশার্ট এবং কমদামের প্রয়োজনীয় পণ্যের চাহিদা বেড়ে যায়, যদিও প্রিমিয়াম ক্যাটাগরি একই থাকতে পারে।',
  },
  {
    id: 'kb-020',
    category: 'inventory',
    content:
      'A fast mover selling more than 1.5 units per day should usually hold at least 21 days of cover if supplier lead time is one week or more.',
    content_bn:
      'যে ফাস্ট মুভার প্রতিদিন ১.৫ ইউনিটের বেশি বিক্রি হয়, আর সরবরাহকারীর লিড টাইম এক সপ্তাহ বা তার বেশি, সেক্ষেত্রে সাধারণত অন্তত ২১ দিনের কভার রাখা উচিত।',
  },
  {
    id: 'kb-021',
    category: 'inventory',
    content:
      'If a category has over 35% of units sitting beyond 60 days, pause fresh buying there until clearance improves.',
    content_bn:
      'কোনো ক্যাটাগরির ৩৫% এর বেশি ইউনিট যদি ৬০ দিনের বেশি সময় ধরে পড়ে থাকে, তাহলে ক্লিয়ারেন্স না বাড়া পর্যন্ত ওই ক্যাটাগরিতে নতুন কেনাকাটা বন্ধ রাখা উচিত।',
  },
  {
    id: 'kb-022',
    category: 'inventory',
    content:
      'Overstock is most dangerous when units are deep in only one size or one color; count imbalance, not just total quantity.',
    content_bn:
      'ওভারস্টক সবচেয়ে ঝুঁকিপূর্ণ হয় যখন স্টক একটি সাইজ বা একটি রঙেই বেশি জমে যায়। তাই শুধু মোট পরিমাণ নয়, সাইজ-রঙের ভারসাম্যহীনতাও হিসাব করুন।',
  },
  {
    id: 'kb-023',
    category: 'inventory',
    content:
      'If stock cover is above 75 days and sell-through is below 30%, classify the item for markdown, bundling, or supplier return discussion.',
    content_bn:
      'স্টক কভার যদি ৭৫ দিনের বেশি হয় এবং সেল-থ্রু ৩০% এর নিচে থাকে, তাহলে ওই পণ্যকে মার্কডাউন, বান্ডলিং বা সাপ্লায়ার রিটার্ন আলোচনার জন্য চিহ্নিত করুন।',
  },
  {
    id: 'kb-024',
    category: 'sales',
    content:
      'Sales growth is healthier when units sold and margin both rise together; revenue growth with margin decline can signal harmful discounting.',
    content_bn:
      'বিক্রির বৃদ্ধি তখনই স্বাস্থ্যকর হয় যখন বিক্রিত ইউনিট এবং মার্জিন দুটোই একসঙ্গে বাড়ে। রাজস্ব বাড়লেও মার্জিন কমে গেলে তা ক্ষতিকর ডিসকাউন্টিংয়ের ইঙ্গিত হতে পারে।',
  },
  {
    id: 'kb-025',
    category: 'sales',
    content:
      'A 30-day sales spike without repeat purchase support often fades quickly, especially if driven by one festival or one viral product.',
    content_bn:
      'রিপিট পারচেজের সমর্থন ছাড়া ৩০ দিনের বিক্রির হঠাৎ উল্লম্ফন অনেক সময় দ্রুত কমে যায়, বিশেষ করে যদি তা একটি উৎসব বা একটি ভাইরাল পণ্যের কারণে হয়ে থাকে।',
  },
  {
    id: 'kb-026',
    category: 'sales',
    content:
      'When units sold rise but average basket value falls, the shop may be over-relying on low-ticket items.',
    content_bn:
      'বিক্রিত ইউনিট বাড়লেও যদি গড় বাস্কেট ভ্যালু কমে যায়, তাহলে দোকানটি হয়তো অতিরিক্তভাবে কমদামের পণ্যের উপর নির্ভর করছে।',
  },
  {
    id: 'kb-027',
    category: 'profit',
    content:
      'Gross profit improves fastest when the shop fixes stock mix mistakes, not only when it increases selling volume.',
    content_bn:
      'গ্রস প্রফিট সবচেয়ে দ্রুত বাড়ে যখন দোকান স্টক মিক্সের ভুলগুলো ঠিক করে, শুধু বিক্রির পরিমাণ বাড়ালেই নয়।',
  },
  {
    id: 'kb-028',
    category: 'profit',
    content:
      'A category with high revenue but gross margin below 15% should be reviewed for hidden discount leakage or rising sourcing cost.',
    content_bn:
      'যে ক্যাটাগরির রাজস্ব বেশি কিন্তু গ্রস মার্জিন ১৫% এর নিচে, সেটিকে লুকানো ডিসকাউন্ট লিকেজ বা সোর্সিং কস্ট বেড়ে যাওয়ার দিক থেকে পর্যালোচনা করা উচিত।',
  },
  {
    id: 'kb-029',
    category: 'profit',
    content:
      'Small price improvements on top sellers often lift monthly profit more safely than aggressive markdowns on weak sellers.',
    content_bn:
      'টপ সেলারে সামান্য দাম বাড়ানো অনেক সময় দুর্বল পণ্যে বড় মার্কডাউনের তুলনায় আরও নিরাপদভাবে মাসিক প্রফিট বাড়ায়।',
  },
  {
    id: 'kb-030',
    category: 'returns',
    content:
      'High returns in apparel often come from size mismatch, color expectation mismatch, or fabric feel mismatch rather than pure product defects.',
    content_bn:
      'পোশাকের ক্ষেত্রে বেশি রিটার্ন সাধারণত সাইজ মিসম্যাচ, রঙ নিয়ে প্রত্যাশা পূরণ না হওয়া, বা কাপড়ের অনুভূতিগত অমিল থেকে আসে; সবসময় পণ্যের ত্রুটি এর কারণ নয়।',
  },
  {
    id: 'kb-031',
    category: 'returns',
    content:
      'If a SKU return rate crosses 8%, review size labeling, product photo accuracy, and staff explanation before buying deeper stock.',
    content_bn:
      'কোনো SKU-র রিটার্ন রেট ৮% ছাড়ালে বেশি স্টক কেনার আগে সাইজ লেবেলিং, পণ্যের ছবি ঠিক আছে কি না, এবং স্টাফের ব্যাখ্যা পর্যালোচনা করুন।',
  },
  {
    id: 'kb-032',
    category: 'supplier',
    content:
      'Suppliers with lead time above 10 days require earlier reorder points and lower tolerance for stockout risk on fast movers.',
    content_bn:
      'যেসব সাপ্লায়ারের লিড টাইম ১০ দিনের বেশি, তাদের ক্ষেত্রে আগে থেকেই রি-অর্ডার পয়েন্ট ধরতে হবে এবং ফাস্ট মুভারে স্টক-আউট ঝুঁকি কম সহ্য করা উচিত।',
  },
  {
    id: 'kb-033',
    category: 'supplier',
    content:
      'If supplier defect rate stays above 3% for two purchase cycles, reduce dependency even if unit cost looks attractive.',
    content_bn:
      'দুইটি ক্রয়চক্র ধরে যদি সাপ্লায়ারের ত্রুটির হার ৩% এর বেশি থাকে, তাহলে ইউনিট কস্ট ভালো দেখালেও তার ওপর নির্ভরশীলতা কমানো উচিত।',
  },
  {
    id: 'kb-034',
    category: 'supplier',
    content:
      'Late deliveries before festival windows can destroy profit more than a 2-3% cost increase from a more reliable supplier.',
    content_bn:
      'উৎসবের মৌসুমের আগে দেরিতে ডেলিভারি অনেক সময় ২-৩% বেশি খরচের নির্ভরযোগ্য সাপ্লায়ারের চেয়েও বেশি প্রফিট নষ্ট করতে পারে।',
  },
  {
    id: 'kb-035',
    category: 'display',
    content:
      'Front-display conversion improves when the first visual row shows the best margin products, not only the cheapest products.',
    content_bn:
      'ফ্রন্ট ডিসপ্লের প্রথম সারিতে শুধু সবচেয়ে সস্তা পণ্য নয়, বরং ভালো মার্জিনের পণ্য রাখলে কনভার্সন বাড়তে পারে।',
  },
  {
    id: 'kb-036',
    category: 'display',
    content:
      'Changing display zones every 7-10 days helps revive items that are not weak products but have become visually stale.',
    content_bn:
      'প্রতি ৭-১০ দিন পর ডিসপ্লে জোন বদলালে এমন পণ্যও আবার নজরে আসে, যেগুলো খারাপ নয় কিন্তু অনেকদিন একইভাবে থাকায় চোখে পড়ে না।',
  },
  {
    id: 'kb-037',
    category: 'display',
    content:
      'During festival weeks, place complete outfit combinations together because decision speed matters more than assortment depth.',
    content_bn:
      'উৎসবের সপ্তাহগুলোতে সম্পূর্ণ আউটফিট একসঙ্গে সাজান, কারণ তখন পণ্যের বৈচিত্র্যের চেয়ে দ্রুত সিদ্ধান্ত নেওয়া বেশি গুরুত্বপূর্ণ হয়।',
  },
  {
    id: 'kb-038',
    category: 'customer',
    content:
      'Repeat buyers respond better to early access, small reserved stock, and bundle convenience than to broad public discounts.',
    content_bn:
      'পুনরায় কেনাকাটা করা ক্রেতারা সবার জন্য বড় ছাড়ের চেয়ে আগে দেখার সুযোগ, অল্প রিজার্ভ স্টক এবং সুবিধাজনক বান্ডেলে বেশি সাড়া দেয়।',
  },
  {
    id: 'kb-039',
    category: 'customer',
    content:
      'If walk-in conversion is strong but repeat visits are weak, the issue may be product continuity or after-sale trust, not footfall.',
    content_bn:
      'ওয়াক-ইন কনভার্সন ভালো হলেও যদি রিপিট ভিজিট কম হয়, তাহলে সমস্যাটি হয়তো ফুটফল নয়; বরং পণ্যের ধারাবাহিকতা বা বিক্রয়-পরবর্তী আস্থার ঘাটতি।',
  },
  {
    id: 'kb-040',
    category: 'customer',
    content:
      'Women and family shoppers often compare matching options; keeping coordinated color groups visible can raise basket size.',
    content_bn:
      'নারী ও পরিবারভিত্তিক ক্রেতারা অনেক সময় মিলিয়ে পণ্য দেখেন। তাই সমন্বিত রঙের গ্রুপ চোখের সামনে রাখলে বাস্কেট সাইজ বাড়তে পারে।',
  },
  {
    id: 'kb-041',
    category: 'cashflow',
    content:
      'If more than 25% of open inventory value is in slow movers, cash flexibility becomes dangerous for small shops.',
    content_bn:
      'খোলা ইনভেন্টরির মূল্যের ২৫% এর বেশি যদি ধীরগতির পণ্যে আটকে থাকে, তাহলে ছোট দোকানের নগদ প্রবাহ ঝুঁকির মধ্যে পড়ে যায়।',
  },
  {
    id: 'kb-042',
    category: 'cashflow',
    content:
      'Use weekly buying caps when festival excitement is high; emotional overbuying often creates dead stock one month later.',
    content_bn:
      'উৎসবের সময় কেনাকাটার উত্তেজনা বেশি থাকলে সাপ্তাহিক কেনার সীমা ঠিক করুন। আবেগের কারণে অতিরিক্ত কেনাকাটা প্রায়ই এক মাস পর ডেড স্টক তৈরি করে।',
  },
  {
    id: 'kb-043',
    category: 'cashflow',
    content:
      'Clearing old stock at break-even is often smarter than holding it for months while missing faster-turning opportunities.',
    content_bn:
      'পুরোনো স্টক ব্রেক-ইভেনে ছাড়িয়ে দেওয়া অনেক সময় মাসের পর মাস ধরে রেখে দ্রুত বিক্রির সুযোগ হারানোর চেয়ে বেশি বুদ্ধিমানের কাজ।',
  },
  {
    id: 'kb-044',
    category: 'forecasting',
    content:
      'When daily sales are noisy, use 7-day moving average for fast movers and 14-day average for slower categories before deciding reorder quantity.',
    content_bn:
      'দৈনিক বিক্রি খুব ওঠানামা করলে ফাস্ট মুভারের জন্য ৭ দিনের মুভিং এভারেজ এবং ধীরগতির ক্যাটাগরির জন্য ১৪ দিনের এভারেজ ব্যবহার করে রি-অর্ডারের পরিমাণ নির্ধারণ করুন।',
  },
  {
    id: 'kb-045',
    category: 'forecasting',
    content:
      'Forecasts should be manually adjusted upward before Eid, Puja, or winter demand spikes; pure historical averages react too late.',
    content_bn:
      'ঈদ, পূজা বা শীতের চাহিদা বাড়ার আগে ফোরকাস্ট হাতে ধরে কিছুটা বাড়িয়ে নিতে হবে। শুধু অতীতের গড়ের ওপর নির্ভর করলে অনেক সময় সিদ্ধান্ত দেরিতে আসে।',
  },
  {
    id: 'kb-046',
    category: 'forecasting',
    content:
      'If forecast error remains above 25% for a category, inspect data quality, supplier delay, and one-off promotions before trusting the model output.',
    content_bn:
      'কোনো ক্যাটাগরিতে ফোরকাস্ট এরর যদি ২৫% এর বেশি থাকে, তাহলে মডেলের আউটপুট ভরসা করার আগে ডেটার মান, সাপ্লায়ারের বিলম্ব এবং এককালীন প্রমোশন আছে কি না দেখুন।',
  },
  {
    id: 'kb-047',
    category: 'markdown',
    content:
      'Markdowns are strongest when scheduled before urgency dies; a product discounted after the season ends usually loses both margin and attention.',
    content_bn:
      'মার্কডাউন সবচেয়ে ভালো কাজ করে যখন চাহিদার তাড়না শেষ হওয়ার আগেই দেওয়া হয়। মৌসুম শেষ হওয়ার পর ছাড় দিলে মার্জিনও কমে, নজরও কমে যায়।',
  },
  {
    id: 'kb-048',
    category: 'markdown',
    content:
      'Use markdown ladders such as 5%, then 8%, then 12% across weeks instead of jumping directly to large cuts.',
    content_bn:
      'সরাসরি বড় ছাড় না দিয়ে ধাপে ধাপে ৫%, তারপর ৮%, তারপর ১২% এভাবে মার্কডাউন ল্যাডার ব্যবহার করুন।',
  },
  {
    id: 'kb-049',
    category: 'markdown',
    content:
      'If markdowns do not improve unit movement within 10-14 days, switch strategy to bundling or front-display repositioning.',
    content_bn:
      'মার্কডাউন দেওয়ার ১০-১৪ দিনের মধ্যে যদি ইউনিট মুভমেন্ট না বাড়ে, তাহলে কৌশল বদলে বান্ডলিং বা ফ্রন্ট ডিসপ্লে পুনর্বিন্যাস করুন।',
  },
  {
    id: 'kb-050',
    category: 'category',
    content:
      'A category that brings traffic but weak margin should support adjacent categories with stronger margin through placement and bundles.',
    content_bn:
      'যে ক্যাটাগরি ক্রেতা আনে কিন্তু মার্জিন কম, সেটিকে এমনভাবে সাজান যাতে তা পাশের ভালো মার্জিনের ক্যাটাগরিকে প্লেসমেন্ট ও বান্ডেলের মাধ্যমে সহায়তা করে।',
  },
  {
    id: 'kb-051',
    category: 'category',
    content:
      'Do not expand a category just because one SKU sold out; confirm that at least three related SKUs also moved well.',
    content_bn:
      'শুধু একটি SKU বিক্রি শেষ হয়ে গেছে বলে পুরো ক্যাটাগরি বাড়াবেন না। অন্তত তিনটি সম্পর্কিত SKU-ও ভালো চলছে কি না নিশ্চিত করুন।',
  },
  {
    id: 'kb-052',
    category: 'category',
    content:
      'When one category contributes more than 45% of revenue, the shop becomes exposed to seasonality and fashion risk.',
    content_bn:
      'কোনো একটি ক্যাটাগরি যদি মোট রাজস্বের ৪৫% এর বেশি দেয়, তাহলে দোকানটি মৌসুমী ও ফ্যাশন ঝুঁকির প্রতি বেশি উন্মুক্ত হয়ে পড়ে।',
  },
  {
    id: 'kb-053',
    category: 'sizing',
    content:
      'Size imbalance causes hidden lost sales; running out of M and L while holding XXL rarely counts as healthy inventory.',
    content_bn:
      'সাইজের ভারসাম্যহীনতা লুকানো বিক্রি হারানোর বড় কারণ। M ও L শেষ হয়ে গিয়ে XXL পড়ে থাকা কখনোই স্বাস্থ্যকর ইনভেন্টরি নয়।',
  },
  {
    id: 'kb-054',
    category: 'sizing',
    content:
      'If 60% or more of demand is concentrated in two sizes, buy those deeper and reduce fringe size depth.',
    content_bn:
      'যদি চাহিদার ৬০% বা তার বেশি মাত্র দুইটি সাইজে কেন্দ্রীভূত থাকে, তাহলে ওই সাইজগুলোতে বেশি গভীরতা রাখুন এবং কম চলা সাইজের পরিমাণ কমান।',
  },
  {
    id: 'kb-055',
    category: 'color',
    content:
      'Neutral colors usually turn faster in basics, while festive categories can justify brighter colors in smaller controlled depth.',
    content_bn:
      'বেসিক পণ্যে সাধারণত নিরপেক্ষ রঙ দ্রুত বিক্রি হয়, আর উৎসবভিত্তিক ক্যাটাগরিতে তুলনামূলক ছোট নিয়ন্ত্রিত পরিমাণে উজ্জ্বল রঙ রাখা যায়।',
  },
  {
    id: 'kb-056',
    category: 'color',
    content:
      'If one color sells less than half the rate of the top color over 30 days, trim reorders there first.',
    content_bn:
      '৩০ দিনের মধ্যে কোনো একটি রঙ যদি সেরা রঙের অর্ধেকেরও কম হারে বিক্রি হয়, তাহলে প্রথমে ওই রঙের রি-অর্ডার কমান।',
  },
  {
    id: 'kb-057',
    category: 'promotion',
    content:
      'Promotions should have one clear goal: clear stock, drive traffic, lift basket size, or launch a category. Mixing goals weakens execution.',
    content_bn:
      'প্রমোশনের একটি স্পষ্ট লক্ষ্য থাকা উচিত: স্টক ক্লিয়ার করা, ক্রেতা আনা, বাস্কেট সাইজ বাড়ানো, বা নতুন ক্যাটাগরি চালু করা। একসঙ্গে অনেক লক্ষ্য নিলে কাজের শক্তি কমে যায়।',
  },
  {
    id: 'kb-058',
    category: 'promotion',
    content:
      'A promotion that raises unit sales but not profit should be treated as a warning, not an automatic success.',
    content_bn:
      'যে প্রমোশন ইউনিট সেল বাড়ায় কিন্তু প্রফিট বাড়ায় না, সেটিকে স্বয়ংক্রিয় সাফল্য নয় বরং সতর্ক সংকেত হিসেবে দেখা উচিত।',
  },
  {
    id: 'kb-059',
    category: 'promotion',
    content:
      'Weekend promotions work best on categories already showing intent, not on completely dead categories with no customer pull.',
    content_bn:
      'উইকেন্ড প্রমোশন সবচেয়ে ভালো কাজ করে সেই ক্যাটাগরিতে যেখানে আগে থেকেই ক্রেতার আগ্রহ আছে; সম্পূর্ণ মৃত ক্যাটাগরিতে এর ফল সাধারণত কম।',
  },
  {
    id: 'kb-060',
    category: 'staff',
    content:
      'Staff should know which products protect margin and which ones are traffic builders; otherwise they oversell the cheapest options.',
    content_bn:
      'স্টাফদের জানা উচিত কোন পণ্য মার্জিন রক্ষা করে আর কোন পণ্য ক্রেতা টানে। না হলে তারা অতিরিক্তভাবে শুধু সস্তা পণ্যই বিক্রি করতে থাকে।',
  },
  {
    id: 'kb-061',
    category: 'staff',
    content:
      'Simple upsell scripts like suggesting matching leggings, scarves, or innerwear can lift basket size without heavy discounting.',
    content_bn:
      'ম্যাচিং লেগিংস, স্কার্ফ বা ইনারওয়্যার সাজেস্ট করার মতো সহজ আপসেল স্ক্রিপ্ট বড় ছাড় ছাড়াই বাস্কেট সাইজ বাড়াতে পারে।',
  },
  {
    id: 'kb-062',
    category: 'risk',
    content:
      'A stockout on a known fast mover during peak season usually damages trust more than the lost sale from one customer.',
    content_bn:
      'পিক সিজনে পরিচিত ফাস্ট মুভার স্টক-আউট হলে তা শুধু একটি বিক্রি হারানোর বিষয় নয়; এটি ক্রেতার আস্থাও নষ্ট করতে পারে।',
  },
  {
    id: 'kb-063',
    category: 'risk',
    content:
      'Dead stock risk rises sharply when a fashion-sensitive item has low movement for 21 days early in its season.',
    content_bn:
      'ফ্যাশন-সংবেদনশীল কোনো পণ্য মৌসুমের শুরুতেই ২১ দিন কম চললে তার ডেড স্টক ঝুঁকি দ্রুত বেড়ে যায়।',
  },
  {
    id: 'kb-064',
    category: 'risk',
    content:
      'Buying depth should be lower when trend confidence is weak, even if social media demand looks exciting for a few days.',
    content_bn:
      'ট্রেন্ড নিয়ে আত্মবিশ্বাস কম থাকলে কেনার গভীরতা কম রাখা উচিত, যদিও সামাজিক মাধ্যমে কয়েক দিনের জন্য চাহিদা খুব আকর্ষণীয় দেখায়।',
  },
  {
    id: 'kb-065',
    category: 'festival',
    content:
      'Festival shopping compresses decision time, so ready-made combinations and visible stock confidence improve conversion.',
    content_bn:
      'উৎসবের কেনাকাটায় সিদ্ধান্ত নেওয়ার সময় কম থাকে, তাই রেডিমেড কম্বিনেশন এবং চোখে পড়ার মতো স্টক কনফিডেন্স কনভার্সন বাড়ায়।',
  },
  {
    id: 'kb-066',
    category: 'festival',
    content:
      'Do not wait for the final 3-4 days before Eid to refill proven bestsellers; supplier and tailoring bottlenecks become expensive.',
    content_bn:
      'ঈদের আগের শেষ ৩-৪ দিন পর্যন্ত অপেক্ষা করে প্রমাণিত বেস্টসেলার রিফিল করবেন না। এ সময়ে সাপ্লায়ার ও টেইলারিংয়ের জট অনেক বেশি খরচ ডেকে আনে।',
  },
  {
    id: 'kb-067',
    category: 'festival',
    content:
      'Giftable accessories and kids wear often lift in the second half of festival shopping windows after primary outfit buying slows.',
    content_bn:
      'উৎসবের কেনাকাটার দ্বিতীয় ভাগে, যখন মূল পোশাক কেনা কিছুটা কমে, তখন উপহারযোগ্য অ্যাক্সেসরিজ এবং শিশুদের পোশাকের বিক্রি বাড়তে পারে।',
  },
  {
    id: 'kb-068',
    category: 'data-quality',
    content:
      'If inventory, sales, and profit numbers do not move together logically, check transaction update rules before changing business strategy.',
    content_bn:
      'ইনভেন্টরি, বিক্রি এবং প্রফিটের সংখ্যা যদি যৌক্তিকভাবে একসঙ্গে না বদলায়, তাহলে ব্যবসার কৌশল পাল্টানোর আগে ট্রানজ্যাকশন আপডেটের নিয়মগুলো পরীক্ষা করুন।',
  },
  {
    id: 'kb-069',
    category: 'data-quality',
    content:
      'Duplicate SKUs and inconsistent product naming can mislead both analytics and RAG explanations by splitting the same demand into multiple records.',
    content_bn:
      'ডুপ্লিকেট SKU এবং অসামঞ্জস্যপূর্ণ পণ্যের নাম একই চাহিদাকে একাধিক রেকর্ডে ভাগ করে দিয়ে অ্যানালিটিক্স এবং RAG ব্যাখ্যা দুটোকেই বিভ্রান্ত করতে পারে।',
  },
  {
    id: 'kb-070',
    category: 'data-quality',
    content:
      'When unit cost is missing, profit insight becomes weak even if revenue insight looks correct.',
    content_bn:
      'ইউনিট কস্ট না থাকলে রাজস্বের হিসাব ঠিক দেখালেও প্রফিট সংক্রান্ত ইনসাইট দুর্বল হয়ে যায়।',
  },
  {
    id: 'kb-071',
    category: 'omnichannel',
    content:
      'Online inquiries can signal demand 5-10 days before walk-in purchase catches up, especially for trendy or festival-led items.',
    content_bn:
      'অনলাইন ইনকোয়ারি অনেক সময় ওয়াক-ইন কেনাকাটার ৫-১০ দিন আগেই চাহিদার ইঙ্গিত দেয়, বিশেষ করে ট্রেন্ডি বা উৎসবভিত্তিক পণ্যের ক্ষেত্রে।',
  },
  {
    id: 'kb-072',
    category: 'omnichannel',
    content:
      'Reserve a small stock buffer for confirmed online orders so walk-in selling does not accidentally create cancellation risk.',
    content_bn:
      'নিশ্চিত অনলাইন অর্ডারের জন্য অল্প একটি স্টক বাফার রাখুন, যাতে ওয়াক-ইন বিক্রির কারণে অর্ডার বাতিল হওয়ার ঝুঁকি না তৈরি হয়।',
  },
  {
    id: 'kb-073',
    category: 'competition',
    content:
      'If nearby shops heavily discount basics, differentiate through quality explanation, bundle value, or better assortment instead of copying every price cut.',
    content_bn:
      'পাশের দোকানগুলো যদি বেসিক পণ্যে বড় ছাড় দেয়, তাহলে প্রতিটি দাম কমানোর নকল না করে মানের ব্যাখ্যা, বান্ডেল ভ্যালু বা উন্নত পণ্যের সমাহারের মাধ্যমে আলাদা হন।',
  },
  {
    id: 'kb-074',
    category: 'competition',
    content:
      'Price matching on every SKU weakens margin discipline; use it selectively only on visible comparison items.',
    content_bn:
      'প্রতিটি SKU-তে প্রাইস ম্যাচিং করলে মার্জিন নিয়ন্ত্রণ দুর্বল হয়ে যায়। এটি শুধু তুলনামূলকভাবে বেশি নজরে থাকা পণ্যে বেছে বেছে ব্যবহার করুন।',
  },
  {
    id: 'kb-075',
    category: 'loyalty',
    content:
      'Simple loyalty habits like remembering prior size, color preference, and festival taste can improve repeat sales more than random coupons.',
    content_bn:
      'ক্রেতার আগের সাইজ, রঙের পছন্দ এবং উৎসবের রুচি মনে রাখার মতো সহজ লয়্যালটি অভ্যাস অনেক সময় এলোমেলো কুপনের চেয়ে বেশি রিপিট সেল আনে।',
  },
  {
    id: 'kb-076',
    category: 'loyalty',
    content:
      'A small VIP preview for repeat customers can help test new styles with lower markdown risk.',
    content_bn:
      'নিয়মিত ক্রেতাদের জন্য ছোট VIP প্রিভিউ রাখলে নতুন স্টাইল কম মার্কডাউন ঝুঁকিতে পরীক্ষা করা যায়।',
  },
  {
    id: 'kb-077',
    category: 'decisioning',
    content:
      'The best weekly apparel decisions usually combine four checks together: sell-through, stock cover, gross margin, and upcoming demand event.',
    content_bn:
      'সপ্তাহভিত্তিক ভালো পোশাক ব্যবসার সিদ্ধান্ত সাধারণত চারটি বিষয় একসঙ্গে দেখে নেওয়া হয়: সেল-থ্রু, স্টক কভার, গ্রস মার্জিন, এবং সামনে আসা চাহিদার ইভেন্ট।',
  },
  {
    id: 'kb-078',
    category: 'decisioning',
    content:
      'Never treat a stock increase alone as success; if the added stock does not convert into profit and healthy movement, it only increases risk.',
    content_bn:
      'শুধু স্টক বেড়েছে বলে সেটিকে সাফল্য ভাববেন না। নতুন স্টক যদি প্রফিট এবং স্বাস্থ্যকর মুভমেন্টে না রূপ নেয়, তাহলে তা শুধু ঝুঁকি বাড়ায়।',
  },
  {
    id: 'kb-079',
    category: 'decisioning',
    content:
      'When a dashboard changes sharply after a data refresh, verify whether the change came from real transactions, recalculation rules, or duplicate imports.',
    content_bn:
      'ডেটা রিফ্রেশের পর ড্যাশবোর্ডে বড় পরিবর্তন দেখা গেলে আগে নিশ্চিত করুন সেটি বাস্তব লেনদেন, রিক্যালকুলেশন নিয়ম, না ডুপ্লিকেট ইমপোর্ট থেকে এসেছে।',
  },
  {
    id: 'kb-080',
    category: 'production-rag',
    content:
      'Production-ready retail RAG should prioritize diverse decision rules, measurable thresholds, and source variety rather than inflated chunk counts.',
    content_bn:
      'প্রোডাকশন-রেডি রিটেইল RAG-এ ফুলিয়ে-ফাঁপিয়ে চাঙ্ক সংখ্যা বাড়ানোর চেয়ে বৈচিত্র্যময় সিদ্ধান্তের নিয়ম, পরিমাপযোগ্য সীমা এবং উৎসের বৈচিত্র্যকে বেশি গুরুত্ব দিতে হবে।',
  },
]

export function buildExpandedKnowledgeSeed() {
  return [...KNOWLEDGE_SEED, ...APPAREL_KNOWLEDGE_CHUNKS]
}
