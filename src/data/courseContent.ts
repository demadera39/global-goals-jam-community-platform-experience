export const courseModules = [
  {
    id: 'module-1',
    moduleNumber: 1,
    title: 'Welcome & Getting Started',
    description: 'Introduction to the Global Goals Jam movement and your journey as a host',
    learningOutcomes: [
      'Understand the Global Goals Jam mission and values',
      'Identify your personal motivation for hosting',
      'Map your local ecosystem and potential partners',
      'Complete your Jamkit inventory assessment'
    ],
    // Fixed audio URL for Module 1
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2FModule1_intro__ad64acb9.mp3?alt=media&token=aa1aba42-4e35-43bd-8d54-fc35bc6a7636',
    media: [
      { type: 'audio', url: 'https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2FModule1_intro__ad64acb9.mp3?alt=media&token=aa1aba42-4e35-43bd-8d54-fc35bc6a7636', title: 'Module 1 — Welcome & Introduction (Audio)' }
    ],
    duration: 45,
    templates: ['Overview & Outcomes Worksheet', 'Personal Intentions Canvas', 'Host Commitment Pledge'],
    exercises: [
      {
        id: 'ex1-1',
        title: 'Jamkit Inventory Assessment',
        description: 'Evaluate your current resources and identify gaps',
        templateId: 'jamkit-checklist'
      },
      {
        id: 'ex1-2',
        title: 'Personal Why Statement',
        description: 'Articulate your motivation for hosting a jam',
        templateId: 'intentions-canvas'
      },
      {
        id: 'ex1-3',
        title: 'Local Partner Mapping',
        description: 'Identify potential collaborators in your community',
        templateId: 'overview-worksheet'
      }
    ]
  },
  {
    id: 'module-2',
    moduleNumber: 2,
    title: 'Complexity & Systems Thinking',
    description: 'Understanding complex challenges and systems approaches to the SDGs',
    learningOutcomes: [
      'Distinguish between complicated and complex problems',
      'Apply systems thinking to SDG challenges',
      'Identify leverage points for intervention',
      'Frame challenges for creative problem-solving'
    ],
    // Fixed audio URL for Module 2
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2FLesson2___93c78949.mp3?alt=media&token=14e05716-4de3-4038-849f-3adb5f2b3815',
    media: [
      { type: 'audio', url: 'https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2FLesson2___93c78949.mp3?alt=media&token=14e05716-4de3-4038-849f-3adb5f2b3815', title: 'Module 2 — Complexity & Systems Thinking (Audio)' }
    ],
    duration: 60,
    templates: ['Complex vs Complicated Matrix', 'Change vs Transformation Canvas', 'Systems Thinking Toolkit'],
    exercises: [
      {
        id: 'ex2-1',
        title: 'Complex vs Complicated Matrix',
        description: 'Categorize challenges in your context',
        templateId: 'complex-matrix'
      },
      {
        id: 'ex2-2',
        title: 'Change vs Transformation',
        description: 'Identify where you need incremental change vs fundamental transformation',
        templateId: 'change-canvas'
      },
      {
        id: 'ex2-3',
        title: 'Systems Mapping Exercise',
        description: 'Map the system around your chosen SDG challenge',
        templateId: 'systems-toolkit'
      }
    ]
  },
  {
    id: 'module-3',
    moduleNumber: 3,
    title: 'Open Design & Knowledge Sharing',
    description: 'Principles of open design and creating shareable knowledge',
    learningOutcomes: [
      'Apply open design principles to your jam',
      'Create effective documentation strategies',
      'Design knowledge sharing workflows',
      'Build community through transparency'
    ],
    // Fixed YouTube URL for Module 3
    videoUrl: 'https://www.youtube.com/watch?v=2S5bQD7S7P8',
    media: [
      { type: 'video', url: 'https://www.youtube.com/watch?v=2S5bQD7S7P8', title: 'Module 3 — Open Design & Knowledge Sharing (Video)' }
    ],
    duration: 50,
    templates: ['Open Design Principles Canvas', 'Knowledge Sharing Strategy', 'Documentation Framework'],
    exercises: [
      {
        id: 'ex3-1',
        title: 'Open Design Assessment',
        description: 'Evaluate your current practices against open design principles',
        templateId: 'open-design-principles'
      },
      {
        id: 'ex3-2',
        title: 'Knowledge Sharing Strategy',
        description: 'Plan how you will capture and share jam outcomes',
        templateId: 'knowledge-sharing-canvas'
      },
      {
        id: 'ex3-3',
        title: 'Documentation Planning',
        description: 'Create your jam documentation framework',
        templateId: 'documentation-template'
      }
    ]
  },
  {
    id: 'module-4',
    moduleNumber: 4,
    title: 'The Jamkit Toolkit',
    description: 'Master the complete toolkit of methods and materials for running successful jams',
    learningOutcomes: [
      'Select appropriate methods for different challenges',
      'Prepare all necessary materials and resources',
      'Create effective session plans',
      'Adapt methods to your local context'
    ],
    // Fixed YouTube URL for Module 4
    videoUrl: 'https://www.youtube.com/watch?v=hrObe89s7OU',
    media: [
      { type: 'video', url: 'https://www.youtube.com/watch?v=hrObe89s7OU', title: 'Module 4 — The Jamkit Toolkit Walkthrough (Video)' }
    ],
    contentHtml: `
      <div class="space-y-6">
        <h2>Module 4: The Jamkit Toolkit</h2>
        <p>Master the complete toolkit of methods and materials for running successful Global Goals Jams.</p>
        
        <h3>Four Categories of Methods</h3>
        <ul>
          <li><strong>Exploration Methods:</strong> Understanding challenges and perspectives</li>
          <li><strong>Ideation Methods:</strong> Generating creative solutions</li>
          <li><strong>Convergence Methods:</strong> Making decisions and prioritizing</li>
          <li><strong>Action Methods:</strong> Transforming ideas into concrete plans</li>
        </ul>
        
        <h3>Session Planning Framework</h3>
        <ol>
          <li><strong>Opening (15-20 min):</strong> Set tone, build connection, orient participants</li>
          <li><strong>Exploration (30-45 min):</strong> Understand the challenge space</li>
          <li><strong>Ideation (45-60 min):</strong> Generate creative solutions</li>
          <li><strong>Convergence (30-40 min):</strong> Prioritize and decide</li>
          <li><strong>Action Planning (20-30 min):</strong> Define next steps</li>
          <li><strong>Closing (10-15 min):</strong> Reflect and celebrate</li>
        </ol>
        
        <h3>Materials Checklist</h3>
        <p>Prepare flip charts, sticky notes, markers, timers, digital tools, and comfort items. Having the right materials ready makes all the difference in facilitation success.</p>
      </div>
    `,
    duration: 75,
    templates: ['Method Selection Guide', 'Session Plan Template', 'Materials Checklist', 'Facilitation Toolkit'],
    exercises: [
      {
        id: 'ex4-1',
        title: 'Method Selection Practice',
        description: 'Choose methods for different scenarios',
        templateId: 'method-selection-guide'
      },
      {
        id: 'ex4-2',
        title: 'Session Planning',
        description: 'Create a detailed plan for your jam',
        templateId: 'session-plan-template'
      },
      {
        id: 'ex4-3',
        title: 'Materials Preparation',
        description: 'Complete checklist for jam materials',
        templateId: 'materials-checklist'
      }
    ]
  },
  {
    id: 'module-5',
    moduleNumber: 5,
    title: 'Advanced Facilitation Mastery',
    description: 'Develop expert facilitation skills for managing groups and complex dynamics',
    learningOutcomes: [
      'Master advanced facilitation techniques',
      'Manage difficult situations with confidence',
      'Create inclusive and energizing environments',
      'Reflect and continuously improve your practice'
    ],
    videoUrl: '',
    duration: 90,
    templates: ['Facilitation Planning Canvas', 'Engagement Techniques Toolkit', 'Reflection & Learning Guide'],
    exercises: [
      {
        id: 'ex5-1',
        title: 'Facilitation Planning',
        description: 'Design your facilitation approach',
        templateId: 'facilitation-plan'
      },
      {
        id: 'ex5-2',
        title: 'Engagement Toolkit',
        description: 'Practice different engagement techniques',
        templateId: 'engagement-techniques'
      },
      {
        id: 'ex5-3',
        title: 'Reflection Practice',
        description: 'Develop your reflection routine',
        templateId: 'reflection-guide'
      }
    ]
  },
  {
    id: 'module-6',
    moduleNumber: 6,
    title: 'Monitoring, Evaluation & Impact',
    description: 'Design practical monitoring frameworks and measure the impact of your jam',
    learningOutcomes: [
      'Define success metrics for your jam',
      'Design simple monitoring tools',
      'Collect and analyze participant feedback',
      'Report impact aligned to SDGs'
    ],
    // Video removed per request
    videoUrl: '',
    media: [],
    duration: 60,
    templates: ['M&E Framework Template', 'Participant Feedback Form', 'Impact Report Template', 'Success Metrics Canvas'],
    exercises: [
      {
        id: 'ex6-1',
        title: 'Define Success Metrics (Practical)',
        description: 'Work with your chosen challenge to define 3–5 clear, measurable success metrics (output, outcome, impact). Provide a short justification for each metric and how you will measure it.',
        steps: [
          'Choose your primary objective (what change are you aiming for?)',
          'Write 3 metrics (one output, one short-term outcome, one long-term impact)',
          'For each metric list: data source, collection method, frequency, responsible person'
        ],
        templateId: 'm&e-framework'
      },
      {
        id: 'ex6-2',
        title: 'Design a Feedback Form (Hands-on)',
        description: 'Create a short participant feedback form (5–8 questions) focusing on learning, satisfaction and actions. Build it in Google Forms or similar and paste the public link into your project notes.',
        steps: [
          'Draft 5 core questions (mix of Likert + open-ended)',
          'Decide how you will distribute the form (email, QR code, in-session link)',
          'Plan how you will analyze results (spreadsheet columns, key charts)'
        ],
        templateId: 'feedback-form'
      },
      {
        id: 'ex6-3',
        title: 'Rapid Observation Guide',
        description: 'Create a one-page observation checklist for facilitators to capture real-time engagement and learning signals during your jam.',
        steps: ['Identify 6 observable behaviours to track', 'Design a simple 3-point scale (low/medium/high)', 'Pilot it in a 30-minute session and note improvements'],
        templateId: 'data-collection-toolkit'
      },
      {
        id: 'ex6-4',
        title: 'Impact Story Snapshot',
        description: 'Write a 300-word narrative summarising one participant story that illustrates the potential impact of your jam. Use this for stakeholder reporting.',
        templateId: 'impact-report'
      }
    ],
    contentHtml: `
      <div class="prose max-w-none">
        <h2>Module 6: Monitoring, Evaluation & Impact</h2>
        <p>This module focuses on pragmatic, low-cost approaches to monitoring and evaluating the difference your Global Goals Jam can make. We prioritise useful methods you can apply immediately.</p>

        <h3>Quick Principles</h3>
        <ul>
          <li><strong>Be purposeful:</strong> Only measure what you care about.</li>
          <li><strong>Start simple:</strong> A few good metrics beat many weak ones.</li>
          <li><strong>Use stories + numbers:</strong> Combine qualitative narratives with basic quantitative data.</li>
          <li><strong>Close the feedback loop:</strong> Use findings to improve future jams.</li>
        </ul>

        <h3>Practical Toolkit</h3>
        <ol>
          <li><strong>Success metrics:</strong> Outputs (attendance, materials produced), Outcomes (new commitments, prototypes tested), Impact (follow-on projects initiated)</li>
          <li><strong>Feedback forms:</strong> Short post-jam surveys with a clear call to action for respondents</li>
          <li><strong>Observation guides:</strong> Lightweight checklists for real-time notes</li>
          <li><strong>Reporting:</strong> One-page impact snapshot + 3-slide stakeholder summary</li>
        </ol>

        <h3>How to use these resources</h3>
        <p>Download the M&amp;E template, adapt the questions to your local context, collect baseline and post-jam data, and use the sample charts in the DataViz guide to present your results to partners.</p>
      </div>
    `
  },
  {
    id: 'module-7',
    moduleNumber: 7,
    title: 'Community Growth & Scaling',
    description: 'Practical strategies to grow your host community and scale impact responsibly',
    learningOutcomes: [
      'Identify growth channels for your local jam',
      'Develop partnerships and collaborations',
      'Create repeatable processes for scaling',
      'Maintain quality while growing reach'
    ],
    videoUrl: '',
    media: [],  // Removed empty video
    duration: 50,
    templates: ['Growth Strategy Playbook', 'Partnership Development Kit', 'Scaling Roadmap Template', 'Community Engagement Plan'],
    exercises: [
      {
        id: 'ex7-1',
        title: 'Growth Playbook Draft (Tactical)',
        description: 'Create a 4-week growth playbook with measurable actions (social, partners, events). Include owners and KPIs.',
        steps: ['List 6 outreach tactics', 'Assign owner and timeline', 'Set one KPI per tactic'],
        templateId: 'growth-playbook'
      },
      {
        id: 'ex7-2',
        title: 'Partnership Pitch',
        description: 'Draft a one-page partnership pitch tailored to a local organisation explaining the value exchange.',
        steps: ['Choose partner type', 'List benefits for partner', 'Propose a 3-month pilot collaboration'],
        templateId: 'partnership-map'
      },
      {
        id: 'ex7-3',
        title: 'Scaling Roadmap (Milestones)',
        description: 'Map a 12-month roadmap highlighting capacity building, quality checks, and expansion milestones.',
        steps: ['Define 4 milestones', 'Identify dependencies and risks', 'Plan quality assurance checks'],
        templateId: 'scaling-roadmap'
      },
      {
        id: 'ex7-4',
        title: 'Community Engagement Sprint',
        description: 'Run a 2-week sprint to onboard 10 new volunteers and capture learning.',
        steps: ['Create onboarding steps', 'Schedule 3 onboarding sessions', 'Collect feedback after sprint'],
        templateId: 'community-strategy'
      }
    ],
    contentHtml: `
      <div class="prose max-w-none">
        <h2>Module 7: Community Growth & Scaling</h2>
        <p>This module gives you tactical, repeatable methods to grow your jam community while protecting local relevance and quality.</p>

        <h3>Growth Principles</h3>
        <ul>
          <li><strong>Quality over quantity:</strong> build trust first</li>
          <li><strong>Local leadership:</strong> enable community-led growth</li>
          <li><strong>Measure what matters:</strong> track retention and activation, not just sign-ups</li>
        </ul>

        <h3>Tactical Channels</h3>
        <ol>
          <li>Universities and student clubs</li>
          <li>Local NGOs and civic organisations</li>
          <li>Corporate partners (CSR programs)</li>
          <li>Digital communities and targeted social ads</li>
        </ol>
      </div>
    `
  },
  {
    id: 'module-8',
    moduleNumber: 8,
    title: 'Capstone Project & Certification',
    description: 'Bring everything together: run a mini-jam and prepare a strong, evidence-based submission for certification',
    learningOutcomes: [
      'Run a mini prototype session',
      'Document and present your outcomes with evidence',
      'Prepare a high-quality certification submission',
      'Reflect and plan next steps for sustained action'
    ],
    // Video removed per request
    videoUrl: '',
    media: [],
    duration: 120,
    templates: ['Capstone Planning Brief', 'Documentation Template', 'Presentation Deck Template', 'Peer Review Form'],
    exercises: [
      {
        id: 'ex8-1',
        title: 'Mini-Jam Planning (Blueprint)',
        description: 'Design a 3–4 hour mini-jam: agenda, roles, materials, and success metrics. Run a dry-run with peers.',
        steps: ['Draft agenda with timeboxes', 'Assign facilitation roles', 'Prepare materials checklist', 'Run dry-run and capture notes'],
        templateId: 'capstone-planning'
      },
      {
        id: 'ex8-2',
        title: 'Facilitation Practice (Peer Review)',
        description: 'Deliver a 30–45 minute facilitation segment to peers and collect structured peer feedback using the peer review form.',
        steps: ['Choose a 30–45 minute segment', 'Facilitate to peers', 'Collect feedback using the peer review form', 'Reflect and refine facilitation notes'],
        templateId: 'facilitation-log'
      },
      {
        id: 'ex8-3',
        title: 'Impact Documentation (Evidence Pack)',
        description: 'Compile a short evidence pack: participant feedback summary, 2 participant stories, 3 photos, and one data chart.',
        steps: ['Export feedback results', 'Select 2 participant quotes with consent', 'Choose 3 photos with captions', 'Create a simple chart showing one key metric'],
        templateId: 'impact-documentation'
      },
      {
        id: 'ex8-4',
        title: 'Certification Submission (Polish & Submit)',
        description: 'Use the certification template to prepare your submission, ensuring each criterion is evidenced and clearly explained.',
        steps: ['Fill out certification template', 'Cross-check criteria and add evidence', 'Get a peer to review before submitting'],
        templateId: 'certification-submission'
      },
      {
        id: 'ex8-5',
        title: 'Presentation & Peer Review',
        description: 'Deliver a 5–10 minute presentation of your mini-jam outcomes and collect peer votes/feedback.',
        steps: ['Create a 5-slide deck', 'Present to peers', 'Collect votes and qualitative feedback', 'Summarise next steps'],
        templateId: 'peer-review-form'
      },
      {
        id: 'ex8-6',
        title: 'Reflection & Next Steps',
        description: 'Create a 3-point action plan for the next 3 months post-certification.',
        steps: ['List three concrete next steps', 'Assign owners and timelines', 'Schedule a 1-month follow-up check-in'],
        templateId: 'next-steps-plan'
      }
    ],
    contentHtml: `
      <div class="prose max-w-none">
        <h2>Module 8: Capstone Project & Certification</h2>
        <p>This final module supports you to run a mini-jam, package evidence, and submit a high-quality certification application that demonstrates deep learning and local impact.</p>

        <h3>Capstone Checklist</h3>
        <ol>
          <li>Clear challenge and objectives</li>
          <li>Participant recruitment and diversity</li>
          <li>Well-structured facilitation plan</li>
          <li>Evidence pack (feedback, photos, outputs)</li>
          <li>Reflection and next steps plan</li>
        </ol>

        <h3>Certification Tips</h3>
        <ul>
          <li>Be concise — use bullet points and short evidence items</li>
          <li>Use participant quotes to add qualitative depth</li>
          <li>Include metrics and at least one visual (chart or photo)</li>
        </ul>
      </div>
    `
  }
];

export const courseResources = {
  1: [
    {
      title: 'Global Goals Overview',
      type: 'article',
      url: 'https://sdgs.un.org/goals',
      description: 'Official UN Sustainable Development Goals website'
    },
    {
      title: 'Design Thinking Basics',
      type: 'guide',
      // IDEO's tools often block automated requests; using Design Kit as an accessible alternative
      url: 'https://www.designkit.org/methods',
      description: "Design Kit's collection of human-centered design methods"
    },
    {
      title: 'Community Building Guide',
      type: 'framework',
      url: 'https://cmxhub.com/',
      description: 'Resources for building and growing online/offline communities'
    },
    {
      title: 'Facilitation Fundamentals',
      type: 'tool',
      url: 'https://www.sessionlab.com/library',
      description: 'Essential facilitation techniques and session planning resources'
    }
  ],
  2: [
    {
      title: 'Systems Thinking Primer',
      type: 'article',
      url: 'https://thesystemsthinker.com/introduction-to-systems-thinking/',
      description: 'Introduction to systems thinking concepts'
    },
    {
      title: 'Complexity Science',
      type: 'framework',
      url: 'https://www.santafe.edu/what-is-complex-systems-science',
      description: "Santa Fe Institute's guide to complexity"
    },
    {
      title: 'Leverage Points',
      type: 'article',
      url: 'https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/',
      description: 'Donella Meadows on system intervention points'
    },
    {
      title: 'Theory of Change',
      type: 'tool',
      url: 'https://www.theoryofchange.org/what-is-theory-of-change/',
      description: 'Creating theories of change for complex problems'
    }
  ],
  3: [
    {
      title: 'Open Source Design',
      type: 'guide',
      url: 'https://opensourcedesign.net/resources/',
      description: 'Principles and practices of open source design'
    },
    {
      title: 'Creative Commons',
      type: 'framework',
      url: 'https://creativecommons.org/share-your-work/',
      description: 'Licensing for open knowledge sharing'
    },
    {
      title: 'Documentation Best Practices',
      type: 'article',
      url: 'https://www.writethedocs.org/guide/writing/beginners-guide-to-docs/',
      description: 'Guide to effective documentation'
    },
    {
      title: 'Knowledge Management',
      type: 'tool',
      url: 'https://www.knowledge-management-tools.net/',
      description: 'Tools and techniques for knowledge management'
    }
  ],
  4: [
    {
      title: 'Method Card Library',
      type: 'tool',
      url: 'https://www.designkit.org/methods',
      description: "Design Kit's human-centered design methods"
    },
    {
      title: 'Sprint Methods',
      type: 'framework',
      url: 'https://www.gv.com/sprint/',
      description: 'Google Ventures design sprint methodology'
    },
    {
      title: 'Workshop Planning',
      type: 'guide',
      url: 'https://www.sessionlab.com/library',
      description: 'Complete guide to planning workshops and trainings'
    },
    {
      title: 'Liberating Structures',
      type: 'tool',
      url: 'https://www.liberatingstructures.com/',
      description: 'Microstructures for including everyone'
    }
  ],
  5: [
    {
      title: 'Advanced Facilitation',
      type: 'article',
      url: 'https://www.iaf-world.org/site/professional/core-competencies',
      description: 'International Association of Facilitators competencies'
    },
    {
      title: 'Conflict Resolution',
      type: 'guide',
      url: 'https://www.mindtools.com/pages/article/newLDR_81.htm',
      description: 'Techniques for managing group conflicts'
    },
    {
      title: 'Group Dynamics',
      type: 'framework',
      url: 'https://www.mindtools.com/pages/article/improving-group-dynamics.htm',
      description: 'Understanding and managing group dynamics'
    },
    {
      title: 'Reflection Tools',
      type: 'tool',
      url: 'https://www.teachingexpertise.com/classroom-management/reflective-practice/',
      description: 'Questions and tools for facilitator reflection'
    }
  ],
  6: [
    {
      title: 'M&E Framework Design',
      type: 'guide',
      url: 'https://www.betterevaluation.org/en/plan/define/develop_logic_model',
      description: 'How to develop logic models and evaluation frameworks'
    },
    {
      title: 'Impact Measurement Primer',
      type: 'tool',
      // OECD pages may block automated requests but the resource is authoritative
      url: 'https://www.oecd.org/development/poverty-reduction/measurement-of-impact.htm',
      description: 'OECD guidance on impact measurement'
    },
    {
      title: 'Feedback & Survey Design',
      type: 'framework',
      url: 'https://support.google.com/docs/answer/6281888?hl=en',
      description: 'Google Forms best practices for surveys'
    },
    {
      title: 'SDG Indicators',
      type: 'article',
      url: 'https://unstats.un.org/sdgs/indicators/indicators-list/',
      description: 'Official SDG indicators for measuring progress'
    },
    {
      title: 'Data Visualization Guide',
      type: 'tool',
      url: 'https://datavizcatalogue.com/',
      description: 'Guide to choosing the right visualization for your data'
    }
  ],
  7: [
    {
      title: 'Community Growth Strategies',
      type: 'guide',
      // replaced research subpage with CMX resources to avoid dead links
      url: 'https://cmxhub.com/resources/',
      description: 'Practical approaches to community growth'
    },
    {
      title: 'Partnership Development',
      type: 'framework',
      url: 'https://partnershipbrokers.org/',
      description: 'Framework for developing effective partnerships'
    },
    {
      title: 'Scaling Social Innovation',
      type: 'article',
      url: 'https://ssir.org/',
      description: 'Stanford Social Innovation Review on scaling approaches'
    },
    {
      title: 'Network Effects Manual',
      type: 'guide',
      url: 'https://www.nfx.com/post/network-effects-manual/',
      description: 'Understanding and leveraging network effects'
    },
    {
      title: 'Community Engagement Tools',
      type: 'tool',
      url: 'https://engagementhub.com.au/resources/',
      description: 'Practical tools for community engagement'
    }
  ],
  8: [
    {
      title: 'Capstone Project Guide',
      type: 'framework',
      url: 'https://www.edutopia.org/article/designing-capstone-projects-authentic-assessments',
      description: 'Designing meaningful capstone experiences and authentic assessment'
    },
    {
      title: 'Reflective Practice',
      type: 'tool',
      url: 'https://www.teachingexpertise.com/classroom-management/reflective-practice/',
      description: 'Tools and techniques for reflective practice'
    },
    {
      title: 'Presentation Skills',
      type: 'guide',
      url: 'https://www.duarte.com/presentation-resources/',
      description: 'Tips for effective presentations and storytelling'
    },
    {
      title: 'Documentation Templates',
      type: 'tool',
      url: 'https://www.smartsheet.com/free-project-management-templates',
      description: 'Free, well-maintained templates for project documentation and reporting'
    },
    {
      title: 'Peer Review & Feedback',
      type: 'article',
      url: 'https://publons.com/community/peer-review/',
      description: 'Practical guidance on peer review and constructive feedback'
    }
  ]
};
