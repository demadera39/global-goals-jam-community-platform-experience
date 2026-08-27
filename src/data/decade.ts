/**
 * Ten Years of Jamming — the curated dataset behind /ten and the Jam Cinema.
 *
 * Everything here was reconstructed in Aug 2026 from public sources: Wayback
 * Machine snapshots of globalgoalsjam.org (2016–2024), UN DESA, the WDO
 * five-year impact article, host blogs (FabCafe, Medium) and YouTube. Numbers
 * follow the official About-page series; where sources conflict we use the
 * official retrospective figure. Sources are linked per entry so claims stay
 * checkable.
 */

/* Sprint colours (Understand / Define / Prototype / Implement) rotate
   through the timeline, one per edition. */
export const SPRINT_COLORS = ['#26BDE2', '#FCC30B', '#FD6925', '#4C9F38'] as const

export interface Edition {
  year: number
  title: string
  /** Cities stat as we can defend it publicly. */
  cities: string
  jammers?: string
  summary: string
  quote?: { text: string; by: string; href?: string }
  /** YouTube id of the video that best captures this edition. */
  videoId?: string
  sourceHref: string
}

export const EDITIONS: Edition[] = [
  {
    year: 2016,
    title: 'Design 2030 Now',
    cities: '17 cities',
    jammers: '500 jammers',
    summary:
      'The first jam, built in six months by MediaLAB Amsterdam and UNDP: from the first sketches in March, via a visit to UNDP in New York in July, to a two-day sprint in 17 cities that September. Physical jamkits were shipped around the world, and the results were presented on stage at the Social Good Summit in New York — alongside then Vice President Biden.',
    quote: {
      text: 'Ideas are nothing without the people that make them real.',
      by: 'From the 2016 Social Good Summit video',
      href: 'https://worlddesignorg.medium.com/impact-report-five-years-of-global-goals-jam-259dae4197f0',
    },
    videoId: 'HXV9PYKXVw0',
    sourceHref: 'https://web.archive.org/web/20161026163933/http://globalgoalsjam.org/',
  },
  {
    year: 2017,
    title: 'The network forms',
    cities: '45 cities',
    jammers: '1,200 jammers',
    summary:
      'From Accra to Tokyo, from Diepsloot to Kyiv: over forty local teams ran their own jam in the same weekend. In Tokyo, teams prototyped farmer education over feature phones; one participant from Mauritius told the host she had been looking for exactly this kind of event for years.',
    quote: {
      text: 'Think BIG, start SMALL, act FAST!',
      by: 'Mariko Sugita, host of GGJ Tokyo 2017',
      href: 'https://medium.com/digitalsocietyschool/global-goals-jam-2017-tokyo-6141f938b7d3',
    },
    videoId: 'vNc8er4o-Jw',
    sourceHref: 'https://web.archive.org/web/20171001000524/http://globalgoalsjam.org/',
  },
  {
    year: 2018,
    title: 'First Digital Society School edition',
    cities: '75 cities',
    jammers: '2,500 jammers',
    summary:
      'The jam moved to the newly founded Digital Society School. FabCafe ran Tokyo, Kyoto and Hong Kong; India got its first jam in Dehradun, Germany in Berlin, and Brazil ran a women-led edition. UNDP built a featured-story hub around the weekend.',
    quote: {
      text: 'You bring in people from diverse backgrounds, and therefore discussions become more complex and multi-perspective, which reflects how society works in real life.',
      by: 'Yuuki Guzman, facilitator, GGJ Tokyo 2018',
      href: 'https://loftwork.com/en/news/2019/08/fabcafe-global-goals-jam-undp-digital-society-school-tokyo/',
    },
    videoId: 'zUJ_0lxvWZI',
    sourceHref: 'https://featured.undp.org/global-goals-2018/',
  },
  {
    year: 2019,
    title: 'The biggest jam',
    cities: '90 cities',
    jammers: '5,000 jammers',
    summary:
      'The largest edition to date, with four global themes and the start of the World Design Organization partnership. In Berlin, a startup founder brought his own challenge — legal aid for asylum seekers — and his team interviewed refugees and prototyped “Refugee Buddy” in one weekend.',
    quote: {
      text: 'Is there anything better than combining our own expertise in Service Design to serve people, planet and prosperity?',
      by: 'Francesca Frisicale, service designer, GGJ Berlin 2019',
      href: 'https://medium.com/the-global-goals-jam/sustainable-development-goals-this-is-the-service-design-we-need-c28672b252a3',
    },
    videoId: 'FmDsa0CxIuI',
    sourceHref: 'https://web.archive.org/web/20191016041751/https://globalgoalsjam.org/',
  },
  {
    year: 2020,
    title: 'Jamming through a pandemic',
    cities: '35 cities',
    summary:
      'COVID forced the jam online, and the network adapted with Miro jamkits and hybrid formats. Germany alone ran eight cities with 300 registrations and around 50 solution concepts. Berlin jammed in person under the motto “Don’t forget to smile — Masks & Smiles”: 25 people, 13 nationalities.',
    quote: {
      text: 'Don’t forget to smile — Masks & Smiles.',
      by: 'GGJ Berlin 2020, jamming in COVID times',
      href: 'https://medium.com/the-global-goals-jam/designing-for-the-decade-of-action-232217f1f293',
    },
    videoId: '9RvUk361oVc',
    sourceHref: 'https://sdgs.un.org/partnerships/global-goals-jam-germany',
  },
  {
    year: 2021,
    title: 'Five years of jamming',
    cities: '60 cities',
    summary:
      'The anniversary edition came with a formal World Design Organization endorsement and a printed five-year impact report. Amsterdam sold out at the Amstelcampus; Japan Today covered Tokyo; Mexico kept jamming into the autumn, including a kids’ edition in Campeche.',
    quote: {
      text: 'I am confident that the program will continue to inspire and motivate new generations of designers.',
      by: 'Srini Srinivasan, president, World Design Organization',
      href: 'https://worlddesignorg.medium.com/impact-report-five-years-of-global-goals-jam-259dae4197f0',
    },
    videoId: 'skW1mcA2RkU',
    sourceHref: 'https://web.archive.org/web/20211003134521/https://globalgoalsjam.org/',
  },
  {
    year: 2022,
    title: 'One global theme: Human Rights',
    cities: 'Worldwide',
    summary:
      'For the first time every city jammed on one shared theme, Human Rights and SDG 16, and the Train-the-Trainer certification launched. IED Milan took on intercultural preconceptions with a cross-border team.',
    videoId: 'Ew2eIqGoEHw',
    sourceHref: 'https://web.archive.org/web/20221006062656/https://globalgoalsjam.org/',
  },
  {
    year: 2023,
    title: 'Biodiversity',
    cities: 'Worldwide',
    summary:
      'The network jammed on how cities can help rebuild biodiversity instead of eroding it, while Digital Society School ran a trainee project to turn the jam into a distributed, peer-feedback community.',
    videoId: 'BK5fmgQCTvI',
    sourceHref: 'https://web.archive.org/web/20231003125949/https://globalgoalsjam.org/',
  },
  {
    year: 2024,
    title: 'Reconnection & Reparation',
    cities: 'Worldwide',
    summary:
      'The ninth edition ran during Global Goals Week, from Impact Hub New York to Centennial College in Toronto, which by now runs both a winter and a fall jam.',
    sourceHref: 'https://web.archive.org/web/20241001021606/https://globalgoalsjam.org/',
  },
  {
    year: 2026,
    title: 'The tenth year',
    cities: 'Your city?',
    summary:
      'Ten years after seventeen cities jammed for the first time, the anniversary edition is coming in September 2026 — with Canada already scheduled and hosts signing up around the world. This is the one to be part of.',
    sourceHref: 'https://luma.com/vjhrv1eo',
  },
]

/* Headline stats — the set we can defend with sources. */
export const DECADE_STATS: { value?: number; suffix?: string; text?: string; label: string }[] = [
  { value: 10, suffix: '', label: 'years of jamming, 2016–2026' },
  { value: 100, suffix: '', label: 'cities have hosted a jam' },
  { text: 'Thousands', label: 'of jammers took part' },
  { value: 200, suffix: '+', label: 'local jams organised' },
]

/* Every city we could verify from archived edition pages and host reports. */
export const DECADE_CITIES: string[] = [
  'Amsterdam', 'Accra', 'Aguascalientes', 'Amman', 'Athens', 'Auckland', 'Austin',
  'Bangalore', 'Bangkok', 'Barcelona', 'Berlin', 'Bilbao', 'Bogotá', 'Campeche',
  'Cologne', 'Concepción', 'Copenhagen', 'Dehradun', 'Delhi', 'Diepsloot',
  'Donostia', 'Dresden', 'Edinburgh', 'Eindhoven', 'Enschede', 'Freiburg',
  'Fukuoka', 'Galway', 'Guayaquil', 'Hamburg', 'Heerlen', 'Hong Kong',
  'Istanbul', 'Kaiserslautern', 'Kampala', 'Kigali', 'Kuala Lumpur', 'Kyiv',
  'Kyoto', 'León', 'Leipzig', 'Lima', 'London', 'Madrid', 'Manaus', 'Melbourne',
  'Mexico City', 'Milan', 'Minsk', 'Mogadishu', 'Monterrey', 'Munich',
  'Newcastle', 'New York', 'Porto', 'Pune', 'Quito', 'Riga', 'Rio de Janeiro',
  'Rioverde', 'Rochester', 'Rome', 'Saint Petersburg', 'San Francisco',
  'Santiago', 'São Tomé', 'Shanghai', 'Shunan', 'Sofia', 'Soweto', 'Stockholm',
  'Sydney', 'Tabasco', 'Tirana', 'Tokyo', 'Toronto', 'Toulouse', 'Turin',
  'Yucatán',
]

/* ── Jam Cinema ─────────────────────────────────────────────── */

export interface JamVideo {
  /** YouTube video id. */
  id: string
  title: string
  year: number
  /** City for community videos; undefined for global/official ones. */
  city?: string
  kind: 'official' | 'community'
  duration?: string
}

/** The hero of the cinema: the official worldwide aftermovie. */
export const HERO_VIDEO: JamVideo = {
  id: 'zUJ_0lxvWZI',
  title: 'Global Goals Jam 2018 — official aftermovie',
  year: 2018,
  kind: 'official',
  duration: '2:23',
}

export const JAM_VIDEOS: JamVideo[] = [
  // Official — MediaLAB Amsterdam era (2016–2017)
  { id: 'IyNSYayCIF0', title: 'Design 2030 Now — launch trailer of the first jam', year: 2016, kind: 'official', duration: '1:54' },
  { id: 'rsllXP-_10g', title: 'Global Goals Jam 2016 — “We live in a world of plenty”', year: 2016, kind: 'official', duration: '1:19' },
  { id: 'HXV9PYKXVw0', title: 'All 17 locations of the first edition — compilation', year: 2016, kind: 'official', duration: '4:42' },
  { id: 'fQ39V5y5QQ0', title: 'GGJ at the Social Good Summit, New York', year: 2016, kind: 'official', duration: '3:56' },
  { id: 'KsmRT2-Jw_c', title: 'Thanks for contributing to the #GlobalGoalsJam', year: 2016, kind: 'official', duration: '0:47' },
  { id: 'i9_VHodg2xM', title: 'Global Goals Jam 2017 — trailer', year: 2017, kind: 'official', duration: '1:26' },
  { id: 'vNc8er4o-Jw', title: '2017 aftermovie — 41 cities, 1,200 participants', year: 2017, kind: 'official', duration: '1:26' },
  { id: 'aEsKuTGXprY', title: '2017 — location footage from around the world', year: 2017, kind: 'official', duration: '4:52' },
  // Official — Digital Society School era
  { id: 'zUJ_0lxvWZI', title: '2018 official aftermovie', year: 2018, kind: 'official', duration: '2:23' },
  { id: 'nwAXCwr_cqo', title: '2018 trailer', year: 2018, kind: 'official', duration: '1:27' },
  { id: 'y7ovxtSGNIk', title: 'GGJ at the Social Good Summit 2018', year: 2018, kind: 'official', duration: '5:36' },
  { id: 'FmDsa0CxIuI', title: '2019 official trailer', year: 2019, kind: 'official', duration: '1:00' },
  { id: '9RvUk361oVc', title: 'Founders’ message — five years of jamming', year: 2020, kind: 'official', duration: '1:23' },
  { id: 'udz4v_xPOfs', title: 'The GGJ story since 2016 (Dutch explainer)', year: 2020, kind: 'official', duration: '1:32' },
  { id: '4MoqBpSG7pA', title: 'Five-year anniversary symposium — full recording', year: 2020, kind: 'official', duration: '1:48:51' },
  { id: 'Ew2eIqGoEHw', title: 'Meet the GGJ trainee team at Digital Society School', year: 2022, kind: 'official', duration: '0:51' },
  // Community — by city
  { id: 'hDXciY1iiwQ', title: 'Fukuoka 2016 — Kyushu University', year: 2016, city: 'Fukuoka', kind: 'community', duration: '3:32' },
  { id: 'XQKop6y6i-4', title: 'Soweto 2017 — Wot-If? Trust', year: 2017, city: 'Soweto', kind: 'community', duration: '3:09' },
  { id: 'FKjNJdX5IBs', title: 'Tokyo 2017 at 100BANCH', year: 2017, city: 'Tokyo', kind: 'community', duration: '2:49' },
  { id: '-cQuQAwx_g0', title: 'Twente 2017 — the Snapchat story', year: 2017, city: 'Enschede', kind: 'community', duration: '6:20' },
  { id: 'ptAdYSiYLzk', title: 'Shanghai pre-event — World Industrial Design Day', year: 2018, city: 'Shanghai', kind: 'community', duration: '1:24' },
  { id: 'dm87TtXZrrY', title: 'Tokyo 2018 — FabCafe', year: 2018, city: 'Tokyo', kind: 'community', duration: '3:04' },
  { id: '08YZ9QA-Xes', title: 'Mexico City 2018', year: 2018, city: 'Mexico City', kind: 'community', duration: '2:53' },
  { id: '8-V-sAwyN4I', title: 'São Tomé and Príncipe 2018 — with UNDP', year: 2018, city: 'São Tomé', kind: 'community', duration: '1:47' },
  { id: 'ZeBXj-k_uAs', title: 'Rio de Janeiro 2018 — PUC Rio', year: 2018, city: 'Rio de Janeiro', kind: 'community', duration: '1:10' },
  { id: 'Tt-ydZ7ab3c', title: 'Melbourne 2018 — SeaTody team pitch', year: 2018, city: 'Melbourne', kind: 'community', duration: '5:21' },
  { id: '82qOj9AhhiI', title: 'Hong Kong 2018 — full event highlights', year: 2018, city: 'Hong Kong', kind: 'community', duration: '5:15' },
  { id: 'ZHzqRkDRswE', title: 'Milan 2018 — IED', year: 2018, city: 'Milan', kind: 'community', duration: '2:46' },
  { id: '1HhfPFO808Y', title: 'Berlin 2019 aftermovie', year: 2019, city: 'Berlin', kind: 'community', duration: '2:13' },
  { id: 'PIkMCTmP7hA', title: 'Tokyo 2019 — FabCafe', year: 2019, city: 'Tokyo', kind: 'community', duration: '3:12' },
  { id: 'cq2mMJ0Rdmw', title: 'Milan 2019 — IED', year: 2019, city: 'Milan', kind: 'community', duration: '1:51' },
  { id: '7c1Mxq5yack', title: 'Enschede 2019 — Saxion aftermovie', year: 2019, city: 'Enschede', kind: 'community', duration: '2:44' },
  { id: 'DQAVog-cKBk', title: 'Tabasco 2019 aftermovie', year: 2019, city: 'Tabasco', kind: 'community', duration: '4:19' },
  { id: 'WS4VKCFgf3Q', title: 'Sydney 2019', year: 2019, city: 'Sydney', kind: 'community', duration: '3:20' },
  { id: 'FGSC24N52j4', title: 'Hamburg 2019', year: 2019, city: 'Hamburg', kind: 'community', duration: '1:56' },
  { id: 'h05Eq_IEAz4', title: 'Galway 2019 — NUI', year: 2019, city: 'Galway', kind: 'community', duration: '2:11' },
  { id: '-T_opsnmzrw', title: 'Athens 2019 — Orange Grove', year: 2019, city: 'Athens', kind: 'community', duration: '0:39' },
  { id: 'bfGwbPAd290', title: 'Mogadishu 2019', year: 2019, city: 'Mogadishu', kind: 'community', duration: '2:34' },
  { id: '-3oHPI3_6_c', title: 'Aguascalientes 2019 — team pitch', year: 2019, city: 'Aguascalientes', kind: 'community' },
  { id: 'brQrnK1LJdc', title: 'Tokyo 2020 — jamming online', year: 2020, city: 'Tokyo', kind: 'community', duration: '2:00' },
  { id: 'CR4elBkuSKs', title: 'Berlin 2020 teaser', year: 2020, city: 'Berlin', kind: 'community', duration: '1:01' },
  { id: '-w4IQnoyExQ', title: 'Fukuoka × Kyoto 2020', year: 2020, city: 'Fukuoka', kind: 'community', duration: '4:10' },
  { id: 'HDu3tz9Uh_k', title: 'Eindhoven 2020', year: 2020, city: 'Eindhoven', kind: 'community', duration: '1:02' },
  { id: '5CDif4MkrW0', title: 'México Iberoamérica 2020 — full event', year: 2020, city: 'Mexico City', kind: 'community', duration: '34:14' },
  { id: 'rTO-j5_YYio', title: 'Tabasco 2020', year: 2020, city: 'Tabasco', kind: 'community' },
  { id: 'skW1mcA2RkU', title: 'Amsterdam 2021 — HvA Green Office aftermovie', year: 2021, city: 'Amsterdam', kind: 'community', duration: '2:00' },
  { id: 'fofhGyvf42M', title: 'Berlin 2021', year: 2021, city: 'Berlin', kind: 'community', duration: '2:34' },
  { id: 'p54qiEFqMoY', title: 'Milan 2021 — “Participate in the change”', year: 2021, city: 'Milan', kind: 'community', duration: '1:03' },
  { id: 'uREUZ3xD93I', title: 'Trans-local jam Japan 2021', year: 2021, city: 'Fukuoka', kind: 'community', duration: '4:37' },
  { id: '4pxvBFVxwL8', title: 'GGJ 2021 online pre-talk — FabCafe livestream', year: 2021, city: 'Tokyo', kind: 'community', duration: '1:57:15' },
  { id: 'pp_tsjYteZ4', title: 'Trans-local jam Japan 2022', year: 2022, city: 'Fukuoka', kind: 'community', duration: '3:53' },
  { id: 'Tfgw1d0RY9Y', title: 'Global Goals Jam 2022 — tini studio', year: 2022, city: 'Eindhoven', kind: 'community', duration: '2:21' },
  { id: '2mbnFiYoieo', title: 'Rwanda 2022 — highlights', year: 2022, city: 'Kigali', kind: 'community', duration: '4:23' },
  { id: 'BK5fmgQCTvI', title: 'Kyushu 2023', year: 2023, city: 'Fukuoka', kind: 'community', duration: '2:54' },
  { id: 'NasHbJXRHbc', title: 'Shunan (Yamaguchi) 2023', year: 2023, city: 'Shunan', kind: 'community', duration: '4:23' },
  { id: 'qLufzRW0Y4Y', title: 'Tabasco 2023', year: 2023, city: 'Tabasco', kind: 'community', duration: '4:21' },
]

export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}

export function youtubeEmbedUrl(id: string, autoplay = false): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0${autoplay ? '&autoplay=1' : ''}`
}
