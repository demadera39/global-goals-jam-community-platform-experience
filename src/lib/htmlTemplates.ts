// HTML Template Generator for Global Goals Jam Host Certification Course

export interface HtmlTemplateData {
  title: string;
  subtitle?: string;
  userName?: string;
  date?: string;
  moduleNumber: number;
  templateType: string;
}

// SDG Colors for consistent branding
export const SDG_COLORS = [
  '#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21', '#26BDE2',
  '#FCC30B', '#A21942', '#FD6925', '#DD1367', '#FD9D24', '#BF8B2E',
  '#3F7E44', '#0A97D9', '#56C02B', '#00689D', '#19486A'
];

const getBaseStyles = () => `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 0;
    }
    
    .sdg-bar {
      display: flex;
      height: 8px;
      width: 100%;
      margin-bottom: 2rem;
    }
    
    .sdg-color {
      flex: 1;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .logo {
      font-size: 0.875rem;
      color: #666;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 1rem;
    }
    
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }
    
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 1.5rem 0 1rem;
    }
    
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #34495e;
      margin: 1.25rem 0 0.75rem;
    }
    
    .subtitle {
      font-size: 1.125rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .info-box {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    
    .info-box p {
      margin: 0.25rem 0;
      color: #555;
    }
    
    .section {
      margin: 2rem 0;
      page-break-inside: avoid;
    }
    
    .input-field {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      margin: 0.5rem 0 1rem;
      background: #fafafa;
    }
    
    .input-field:focus {
      outline: none;
      border-color: #4CAF50;
      background: white;
    }
    
    .small-input {
      min-height: 50px;
    }
    
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin: 1.5rem 0;
    }
    
    .grid-box {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      background: #fafafa;
    }
    
    .grid-box h3 {
      margin-top: 0;
      color: #2c3e50;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .checkbox-group {
      margin: 1rem 0;
    }
    
    .checkbox-item {
      display: flex;
      align-items: flex-start;
      margin: 0.75rem 0;
    }
    
    .checkbox-item input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      margin-top: 2px;
      cursor: pointer;
    }
    
    .checkbox-item label {
      flex: 1;
      cursor: pointer;
      color: #444;
    }
    
    .matrix {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 1px;
      background: #ccc;
      border: 2px solid #999;
      border-radius: 8px;
      overflow: hidden;
      margin: 1.5rem 0;
      min-height: 400px;
    }
    
    .matrix-cell {
      background: white;
      padding: 1.5rem;
      position: relative;
    }
    
    .matrix-label {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }
    
    .matrix-desc {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .comparison-table {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin: 2rem 0;
    }
    
    .comparison-column {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
    }
    
    .comparison-column h3 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: -1.5rem -1.5rem 1rem;
      padding: 1rem 1.5rem;
      border-radius: 6px 6px 0 0;
    }
    
    .comparison-column.transformation h3 {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .prompt-list {
      list-style: none;
      padding: 0;
    }
    
    .prompt-list li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
      color: #555;
    }
    
    .prompt-list li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #4CAF50;
      font-weight: bold;
    }
    
    .iceberg-model {
      margin: 2rem 0;
    }
    
    .iceberg-level {
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 0.5rem 0;
      background: linear-gradient(to bottom, #fff, #f8f9fa);
    }
    
    .iceberg-level.events {
      background: linear-gradient(to bottom, #e3f2fd, #bbdefb);
    }
    
    .iceberg-level.patterns {
      background: linear-gradient(to bottom, #bbdefb, #90caf9);
    }
    
    .iceberg-level.structures {
      background: linear-gradient(to bottom, #90caf9, #64b5f6);
    }
    
    .iceberg-level.mental-models {
      background: linear-gradient(to bottom, #64b5f6, #42a5f5);
    }
    
    .pledge-item {
      display: flex;
      align-items: flex-start;
      margin: 1rem 0;
      padding: 1rem;
      background: #f0f8ff;
      border-left: 4px solid #4CAF50;
      border-radius: 4px;
    }
    
    .pledge-item .icon {
      color: #4CAF50;
      font-size: 1.5rem;
      margin-right: 1rem;
    }
    
    .signature-section {
      margin-top: 3rem;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .signature-field {
      display: flex;
      align-items: center;
      margin: 1rem 0;
    }
    
    .signature-field label {
      min-width: 120px;
      font-weight: 600;
      color: #555;
    }
    
    .signature-field input {
      flex: 1;
      border: none;
      border-bottom: 2px solid #333;
      background: transparent;
      padding: 0.5rem;
      font-size: 1rem;
    }
    
    .footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.875rem;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .container {
        max-width: 100%;
        padding: 1rem;
      }
      
      .input-field {
        background: white;
        border: 1px solid #999;
      }
      
      .no-print {
        display: none;
      }
    }
    
    .instructions {
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }
    
    .instructions h4 {
      color: #856404;
      margin-bottom: 0.5rem;
    }
    
    .instructions p {
      color: #856404;
      margin: 0.25rem 0;
    }
  </style>
`;

const getSDGBar = () => {
  return `
    <div class="sdg-bar">
      ${SDG_COLORS.map(color => `<div class="sdg-color" style="background: ${color};"></div>`).join('')}
    </div>
  `;
};

const getHeader = (title: string, subtitle?: string) => {
  return `
    <div class="header">
      <div class="logo">GLOBAL GOALS JAM</div>
      <h1>${title}</h1>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    </div>
  `;
};

const getFooter = () => {
  return `
    <div class="footer">
      <p>Global Goals Jam Host Certification Course</p>
      <p>© ${new Date().getFullYear()} Global Goals Jam. This work is licensed under Creative Commons.</p>
    </div>
  `;
};

// Module 1 Templates
export const generateOverviewWorksheetHTML = (data: HtmlTemplateData): string => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      ${getBaseStyles()}
    </head>
    <body>
      ${getSDGBar()}
      <div class="container">
        ${getHeader(data.title, 'Define your hosting goals and measurable outcomes')}
        
        <div class="info-box">
          <p><strong>Name:</strong> ${data.userName || '_______________________'}</p>
          <p><strong>Date:</strong> ${data.date || new Date().toLocaleDateString()}</p>
          <p><strong>Module:</strong> ${data.moduleNumber} - Welcome & Intentions</p>
        </div>
        
        <div class="instructions">
          <h4>📝 How to use this worksheet:</h4>
          <p>1. Take 15-20 minutes to thoughtfully complete each section</p>
          <p>2. Be specific and measurable in your goals</p>
          <p>3. Save this document to track your progress</p>
          <p>4. Revisit after your first jam to reflect on achievements</p>
        </div>
        
        <div class="section">
          <h2>Part 1: Personal Hosting Goals</h2>
          <p>What do you hope to achieve as a Global Goals Jam host? Think about your personal growth, community impact, and contribution to the SDGs.</p>
          <textarea class="input-field" placeholder="Example: I want to bring together 30 local changemakers to address SDG 11 (Sustainable Cities) in my community. I aim to facilitate meaningful connections between NGOs, students, and local government to create lasting partnerships..."></textarea>
        </div>
        
        <div class="section">
          <h2>Part 2: Expected Outcomes</h2>
          
          <h3>1. Participant Engagement</h3>
          <p>How many participants do you aim to engage in your first jam?</p>
          <textarea class="input-field small-input" placeholder="Example: 25-35 participants, including 10 students, 10 professionals, 5 NGO representatives, and 5-10 community members"></textarea>
          
          <h3>2. SDG Focus Areas</h3>
          <p>Which Sustainable Development Goals will be your primary focus? Why these specific goals?</p>
          <textarea class="input-field" placeholder="Example: Primary focus on SDG 11 (Sustainable Cities) and SDG 13 (Climate Action) because our city faces urban sprawl and heat island challenges..."></textarea>
          
          <h3>3. Local Partnerships</h3>
          <p>Which organizations or institutions do you plan to involve?</p>
          <textarea class="input-field" placeholder="Example: City Innovation Lab, University Design Department, Green Building Council, Youth Climate Network, Chamber of Commerce..."></textarea>
          
          <h3>4. Expected Impact</h3>
          <p>What tangible outcomes do you hope to achieve?</p>
          <textarea class="input-field" placeholder="Example: 3-5 prototype solutions, 2 new cross-sector partnerships formed, 1 solution selected for pilot implementation..."></textarea>
        </div>
        
        <div class="section">
          <h2>Part 3: Success Metrics</h2>
          <p>How will you measure the success of your jam? Define specific, measurable indicators.</p>
          
          <h3>Quantitative Metrics</h3>
          <textarea class="input-field" placeholder="Example: Number of participants, solutions generated, partnerships formed, follow-up meetings scheduled, media coverage..."></textarea>
          
          <h3>Qualitative Metrics</h3>
          <textarea class="input-field" placeholder="Example: Participant feedback scores, quality of solutions, diversity of perspectives, energy and engagement levels, commitment to continue..."></textarea>
          
          <h3>Long-term Impact Indicators</h3>
          <textarea class="input-field" placeholder="Example: Solutions implemented after 6 months, partnerships still active after 1 year, policy changes influenced, community awareness increased..."></textarea>
        </div>
        
        <div class="section">
          <h2>Part 4: Personal Reflection</h2>
          <p>What skills or experiences do you bring that will help you succeed as a host?</p>
          <textarea class="input-field" placeholder="Reflect on your facilitation experience, network, knowledge of SDGs, passion for change..."></textarea>
          
          <p>What support or resources do you need to achieve these goals?</p>
          <textarea class="input-field" placeholder="Consider venue, funding, co-facilitators, materials, expert speakers..."></textarea>
        </div>
        
        ${getFooter()}
      </div>
    </body>
    </html>
  `;
  return html;
};

export const generateIntentionsCanvasHTML = (data: HtmlTemplateData): string => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      ${getBaseStyles()}
    </head>
    <body>
      ${getSDGBar()}
      <div class="container">
        ${getHeader(data.title, 'Map your motivations and alignment with the SDGs')}
        
        <div class="info-box">
          <p><strong>Name:</strong> ${data.userName || '_______________________'}</p>
          <p><strong>Date:</strong> ${data.date || new Date().toLocaleDateString()}</p>
          <p><strong>Module:</strong> ${data.moduleNumber} - Welcome & Intentions</p>
        </div>
        
        <div class="instructions">
          <h4>🎯 How to use this canvas:</h4>
          <p>1. Start with your personal motivation - why does this matter to you?</p>
          <p>2. Map your existing skills and resources you can leverage</p>
          <p>3. Identify specific community needs you want to address</p>
          <p>4. Define your commitment level and availability</p>
          <p>5. Connect everything to specific SDGs at the bottom</p>
        </div>
        
        <div class="section">
          <h2>Your Hosting Intentions Canvas</h2>
          
          <div class="grid-2">
            <div class="grid-box">
              <h3>🔥 My Motivation</h3>
              <p>Why do I want to host a Global Goals Jam?</p>
              <textarea class="input-field" placeholder="What drives you? What change do you want to see? What personal experiences shape your passion?"></textarea>
            </div>
            
            <div class="grid-box">
              <h3>💪 My Skills & Resources</h3>
              <p>What do I bring to the table?</p>
              <textarea class="input-field" placeholder="Your facilitation skills, network, venue access, funding sources, technical expertise, languages spoken..."></textarea>
            </div>
            
            <div class="grid-box">
              <h3>🌍 My Community Needs</h3>
              <p>What challenges does my community face?</p>
              <textarea class="input-field" placeholder="Local environmental issues, social inequalities, economic challenges, urban problems, health concerns..."></textarea>
            </div>
            
            <div class="grid-box">
              <h3>⏰ My Commitment</h3>
              <p>What can I realistically commit?</p>
              <textarea class="input-field" placeholder="Time per week, duration of commitment, number of jams per year, follow-up capacity..."></textarea>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>SDG Alignment</h2>
          <p>Which Sustainable Development Goals resonate most with your intentions? Check all that apply and add notes about why.</p>
          
          <div class="checkbox-group">
            <div class="checkbox-item">
              <input type="checkbox" id="sdg1">
              <label for="sdg1"><strong>SDG 1: No Poverty</strong> - End poverty in all its forms everywhere</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg2">
              <label for="sdg2"><strong>SDG 2: Zero Hunger</strong> - End hunger, achieve food security</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg3">
              <label for="sdg3"><strong>SDG 3: Good Health</strong> - Ensure healthy lives and well-being</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg4">
              <label for="sdg4"><strong>SDG 4: Quality Education</strong> - Ensure inclusive education</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg5">
              <label for="sdg5"><strong>SDG 5: Gender Equality</strong> - Achieve gender equality</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg6">
              <label for="sdg6"><strong>SDG 6: Clean Water</strong> - Ensure water and sanitation for all</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg7">
              <label for="sdg7"><strong>SDG 7: Affordable Energy</strong> - Ensure access to clean energy</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg8">
              <label for="sdg8"><strong>SDG 8: Decent Work</strong> - Promote economic growth and decent work</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg9">
              <label for="sdg9"><strong>SDG 9: Industry & Innovation</strong> - Build resilient infrastructure</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg10">
              <label for="sdg10"><strong>SDG 10: Reduced Inequalities</strong> - Reduce inequality</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg11">
              <label for="sdg11"><strong>SDG 11: Sustainable Cities</strong> - Make cities inclusive and sustainable</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg12">
              <label for="sdg12"><strong>SDG 12: Responsible Consumption</strong> - Ensure sustainable consumption</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg13">
              <label for="sdg13"><strong>SDG 13: Climate Action</strong> - Take urgent action on climate change</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg14">
              <label for="sdg14"><strong>SDG 14: Life Below Water</strong> - Conserve oceans and marine resources</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg15">
              <label for="sdg15"><strong>SDG 15: Life on Land</strong> - Protect terrestrial ecosystems</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg16">
              <label for="sdg16"><strong>SDG 16: Peace & Justice</strong> - Promote peaceful and inclusive societies</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="sdg17">
              <label for="sdg17"><strong>SDG 17: Partnerships</strong> - Strengthen global partnerships</label>
            </div>
          </div>
          
          <h3>Your SDG Story</h3>
          <p>How do your selected SDGs connect to your personal motivation and community needs?</p>
          <textarea class="input-field" placeholder="Explain the connections between your chosen SDGs, your motivation, and your community's specific challenges..."></textarea>
        </div>
        
        <div class="section">
          <h2>Synthesis: Your Hosting Vision</h2>
          <p>Bringing it all together, write a brief vision statement for your role as a Global Goals Jam host:</p>
          <textarea class="input-field" placeholder="Example: As a Global Goals Jam host, I will leverage my facilitation skills and local network to bring together diverse stakeholders to co-create solutions for sustainable urban development (SDG 11) in my city. I commit to hosting quarterly jams and supporting implementation of at least one solution annually..."></textarea>
        </div>
        
        ${getFooter()}
      </div>
    </body>
    </html>
  `;
  return html;
};

export const generateHostPledgeHTML = (data: HtmlTemplateData): string => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      ${getBaseStyles()}
    </head>
    <body>
      ${getSDGBar()}
      <div class="container">
        ${getHeader(data.title, 'Your commitment to the Global Goals Jam movement')}
        
        <div class="info-box">
          <p><strong>Module:</strong> ${data.moduleNumber} - Welcome & Intentions</p>
          <p>This pledge represents your commitment to upholding the values and principles of the Global Goals Jam movement.</p>
        </div>
        
        <div class="section">
          <h2>The Global Goals Jam Host Pledge</h2>
          <p>As a Global Goals Jam host, I understand the responsibility and opportunity to create positive change in my community. By signing this pledge, I commit to:</p>
          
          <div class="pledge-item">
            <span class="icon">🤝</span>
            <div>
              <strong>Create an Inclusive Environment</strong>
              <p>I will ensure my jam is welcoming to all participants regardless of background, expertise, age, gender, ethnicity, or ability. I will actively work to remove barriers to participation and create a safe space for all voices to be heard.</p>
            </div>
          </div>
          
          <div class="pledge-item">
            <span class="icon">📚</span>
            <div>
              <strong>Follow the Global Goals Jam Methodology</strong>
              <p>I will use the proven GGJ methodology and toolkit, including the 6-sprint process, to guide participants through a structured journey from understanding challenges to creating actionable solutions.</p>
            </div>
          </div>
          
          <div class="pledge-item">
            <span class="icon">🌍</span>
            <div>
              <strong>Document and Share Openly</strong>
              <p>I will document the process, outcomes, and learnings from my jam and share them with the global community through the GGJ platform. I believe in open design and will ensure all outputs are freely accessible.</p>
            </div>
          </div>
          
          <div class="pledge-item">
            <span class="icon">💡</span>
            <div>
              <strong>Support Solution Development</strong>
              <p>I will help participants move from ideas to actionable prototypes, providing guidance, resources, and connections to help their solutions become reality.</p>
            </div>
          </div>
          
          <div class="pledge-item">
            <span class="icon">🔗</span>
            <div>
              <strong>Connect to the Global Network</strong>
              <p>I will actively engage with the global GGJ community, sharing experiences, learning from other hosts, and contributing to the collective knowledge base.</p>
            </div>
          </div>
          
          <div class="pledge-item">
            <span class="icon">📊</span>
            <div>
              <strong>Measure and Report Impact</strong>
              <p>I will track the outcomes of my jam, including participant numbers, solutions generated, partnerships formed, and long-term impact. I will report these metrics to help demonstrate the collective impact of the movement.</p>
            </div>
          </div>
          
          <div class="pledge-item">
            <span class="icon">🚀</span>
            <div>
              <strong>Support Implementation</strong>
              <p>I understand that the jam is just the beginning. I commit to supporting participants in implementing their solutions through follow-up sessions, connections to resources, and ongoing mentorship.</p>
            </div>
          </div>
          
          <div class="pledge-item">
            <span class="icon">🎯</span>
            <div>
              <strong>Focus on the SDGs</strong>
              <p>I will ensure that all jam activities are clearly connected to one or more Sustainable Development Goals, helping participants understand how their local actions contribute to global targets.</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Additional Personal Commitments</h2>
          <p>Beyond the core pledge, what specific commitments do you want to make?</p>
          <textarea class="input-field" placeholder="Example: I commit to hosting at least 2 jams per year, engaging minimum 50 participants annually, and supporting the implementation of at least one solution..."></textarea>
        </div>
        
        <div class="signature-section">
          <h2>Host Declaration</h2>
          <p>I have read and understood the Global Goals Jam Host Pledge. I commit to upholding these principles and contributing to the global movement for sustainable development.</p>
          
          <div class="signature-field">
            <label>Full Name:</label>
            <input type="text" placeholder="Enter your full name">
          </div>
          
          <div class="signature-field">
            <label>Location:</label>
            <input type="text" placeholder="City, Country">
          </div>
          
          <div class="signature-field">
            <label>Organization:</label>
            <input type="text" placeholder="Your organization (if applicable)">
          </div>
          
          <div class="signature-field">
            <label>Email:</label>
            <input type="email" placeholder="your.email@example.com">
          </div>
          
          <div class="signature-field">
            <label>Date:</label>
            <input type="text" value="${new Date().toLocaleDateString()}">
          </div>
          
          <div class="signature-field">
            <label>Signature:</label>
            <input type="text" placeholder="Type your name as signature">
          </div>
        </div>
        
        ${getFooter()}
      </div>
    </body>
    </html>
  `;
  return html;
};

// Module 2 Templates
export const generateComplexMatrixHTML = (data: HtmlTemplateData): string => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      ${getBaseStyles()}
    </head>
    <body>
      ${getSDGBar()}
      <div class="container">
        ${getHeader(data.title, 'Categorize challenges to apply the right approach')}
        
        <div class="info-box">
          <p><strong>Name:</strong> ${data.userName || '_______________________'}</p>
          <p><strong>Date:</strong> ${data.date || new Date().toLocaleDateString()}</p>
          <p><strong>Module:</strong> ${data.moduleNumber} - Understanding Complexity</p>
        </div>
        
        <div class="instructions">
          <h4>🎯 How to use this matrix:</h4>
          <p>1. Identify a challenge in your community related to the SDGs</p>
          <p>2. Analyze its characteristics using the questions below</p>
          <p>3. Place it in the appropriate quadrant</p>
          <p>4. This will help you choose the right approach for your jam</p>
        </div>
        
        <div class="section">
          <h2>Understanding the Difference</h2>
          
          <div class="comparison-table">
            <div class="comparison-column">
              <h3>Complicated</h3>
              <ul class="prompt-list">
                <li>Has knowable cause-and-effect relationships</li>
                <li>Can be solved with expertise and analysis</li>
                <li>Best practices exist and can be applied</li>
                <li>Solutions are replicable</li>
                <li>Example: Building a bridge, fixing a car</li>
              </ul>
            </div>
            
            <div class="comparison-column transformation">
              <h3>Complex</h3>
              <ul class="prompt-list">
                <li>Cause-and-effect only clear in retrospect</li>
                <li>Requires experimentation and adaptation</li>
                <li>Solutions emerge from the system</li>
                <li>Context-specific, not replicable</li>
                <li>Example: Reducing inequality, climate change</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>The Complexity Matrix</h2>
          <p>Use this matrix to categorize challenges based on their level of agreement and certainty:</p>
          
          <div class="matrix">
            <div class="matrix-cell">
              <div class="matrix-label">Simple/Obvious</div>
              <div class="matrix-desc">High agreement, High certainty</div>
              <textarea class="input-field small-input" placeholder="Clear problems with known solutions. Example: Lack of recycling bins in public spaces"></textarea>
            </div>
            
            <div class="matrix-cell">
              <div class="matrix-label">Complicated</div>
              <div class="matrix-desc">Low agreement, High certainty</div>
              <textarea class="input-field small-input" placeholder="Technical problems requiring expertise. Example: Designing efficient public transport routes"></textarea>
            </div>
            
            <div class="matrix-cell">
              <div class="matrix-label">Complex</div>
              <div class="matrix-desc">High agreement, Low certainty</div>
              <textarea class="input-field small-input" placeholder="Adaptive challenges with emergent solutions. Example: Reducing youth unemployment"></textarea>
            </div>
            
            <div class="matrix-cell">
              <div class="matrix-label">Chaotic/Wicked</div>
              <div class="matrix-desc">Low agreement, Low certainty</div>
              <textarea class="input-field small-input" placeholder="Crisis situations or wicked problems. Example: Post-disaster recovery, systemic poverty"></textarea>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Your Challenge Analysis</h2>
          
          <h3>1. Define Your Challenge</h3>
          <p>What specific SDG-related challenge will your jam address?</p>
          <textarea class="input-field" placeholder="Be specific. Example: High youth unemployment (25%) in our city's immigrant communities, connected to SDG 8 (Decent Work) and SDG 10 (Reduced Inequalities)"></textarea>
          
          <h3>2. Analyze Characteristics</h3>
          
          <p><strong>Level of Agreement:</strong> Is there consensus on what the problem is?</p>
          <textarea class="input-field small-input" placeholder="High/Medium/Low - Explain why"></textarea>
          
          <p><strong>Level of Certainty:</strong> Do we know what will work to solve it?</p>
          <textarea class="input-field small-input" placeholder="High/Medium/Low - Explain why"></textarea>
          
          <p><strong>Stakeholder Diversity:</strong> How many different groups are involved?</p>
          <textarea class="input-field small-input" placeholder="List key stakeholders and their different perspectives"></textarea>
          
          <p><strong>Interconnections:</strong> How does this connect to other challenges?</p>
          <textarea class="input-field" placeholder="Map the connections. Example: Youth unemployment connects to education quality, economic growth, mental health, social cohesion..."></textarea>
          
          <h3>3. Categorization</h3>
          <p>Based on your analysis, which quadrant does your challenge belong to?</p>
          <textarea class="input-field small-input" placeholder="Simple / Complicated / Complex / Chaotic - and why?"></textarea>
          
          <h3>4. Approach Selection</h3>
          <p>What approach will work best for this type of challenge?</p>
          
          <div class="checkbox-group">
            <div class="checkbox-item">
              <input type="checkbox" id="approach1">
              <label for="approach1"><strong>Best Practice:</strong> Apply proven solutions (for Simple)</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="approach2">
              <label for="approach2"><strong>Good Practice:</strong> Bring in experts and analyze (for Complicated)</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="approach3">
              <label for="approach3"><strong>Emergent Practice:</strong> Experiment and adapt (for Complex)</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="approach4">
              <label for="approach4"><strong>Novel Practice:</strong> Act quickly, then assess (for Chaotic)</label>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Implications for Your Jam</h2>
          <p>How will this complexity assessment shape your jam design?</p>
          <textarea class="input-field" placeholder="Example: Since youth unemployment is a complex challenge, we'll focus on prototyping multiple small experiments rather than one big solution. We'll bring together diverse stakeholders including youth, employers, educators, and support services to explore the system together..."></textarea>
        </div>
        
        ${getFooter()}
      </div>
    </body>
    </html>
  `;
  return html;
};

export const generateChangeCanvasHTML = (data: HtmlTemplateData): string => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      ${getBaseStyles()}
    </head>
    <body>
      ${getSDGBar()}
      <div class="container">
        ${getHeader(data.title, 'Compare incremental change vs systemic transformation')}
        
        <div class="info-box">
          <p><strong>Name:</strong> ${data.userName || '_______________________'}</p>
          <p><strong>Date:</strong> ${data.date || new Date().toLocaleDateString()}</p>
          <p><strong>Module:</strong> ${data.moduleNumber} - Understanding Complexity</p>
        </div>
        
        <div class="instructions">
          <h4>🔄 How to use this canvas:</h4>
          <p>1. Think about your SDG challenge from two perspectives</p>
          <p>2. Fill in the CHANGE column for incremental improvements</p>
          <p>3. Fill in the TRANSFORMATION column for systemic shifts</p>
          <p>4. Compare both approaches to find the right balance</p>
        </div>
        
        <div class="section">
          <h2>Your Challenge</h2>
          <p>What SDG challenge are you analyzing?</p>
          <textarea class="input-field small-input" placeholder="Example: Plastic pollution in our coastal community (SDG 14: Life Below Water)"></textarea>
        </div>
        
        <div class="section">
          <div class="comparison-table">
            <div class="comparison-column">
              <h3>CHANGE (Incremental)</h3>
              <p>Working within the existing system</p>
              
              <h4>What can be improved?</h4>
              <textarea class="input-field" placeholder="Example: Better recycling programs, more bins, education campaigns, beach cleanups..."></textarea>
              
              <h4>Quick wins possible?</h4>
              <textarea class="input-field" placeholder="Example: Monthly beach cleanups, plastic-free events, reusable bag distribution..."></textarea>
              
              <h4>Resources needed?</h4>
              <textarea class="input-field" placeholder="Example: Volunteers, cleaning supplies, educational materials, small grants..."></textarea>
              
              <h4>Timeline?</h4>
              <textarea class="input-field small-input" placeholder="Example: 3-6 months for initial results"></textarea>
              
              <h4>Key stakeholders?</h4>
              <textarea class="input-field" placeholder="Example: Local schools, beach users, tourism board, waste management..."></textarea>
              
              <h4>Success metrics?</h4>
              <textarea class="input-field" placeholder="Example: Kg of plastic collected, number of participants, bins installed..."></textarea>
            </div>
            
            <div class="comparison-column transformation">
              <h3>TRANSFORMATION (Systemic)</h3>
              <p>Reimagining the system itself</p>
              
              <h4>What must be reimagined?</h4>
              <textarea class="input-field" placeholder="Example: Circular economy, zero-waste systems, producer responsibility, consumption patterns..."></textarea>
              
              <h4>System barriers?</h4>
              <textarea class="input-field" placeholder="Example: Linear economy model, consumer culture, lack of alternatives, policy gaps..."></textarea>
              
              <h4>New paradigms needed?</h4>
              <textarea class="input-field" placeholder="Example: Plastic-free economy, regenerative tourism, ocean as commons, waste as resource..."></textarea>
              
              <h4>Long-term vision?</h4>
              <textarea class="input-field small-input" placeholder="Example: Zero plastic waste by 2030, circular economy hub"></textarea>
              
              <h4>Coalition required?</h4>
              <textarea class="input-field" placeholder="Example: Government, businesses, NGOs, research institutions, international partners..."></textarea>
              
              <h4>Transformation indicators?</h4>
              <textarea class="input-field" placeholder="Example: Policy changes, new business models, behavior shifts, ecosystem health..."></textarea>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Synthesis: Your Approach</h2>
          
          <h3>Which elements from each column will you incorporate?</h3>
          <textarea class="input-field" placeholder="Example: We'll start with beach cleanups and education (change) while building coalition for plastic-free policy (transformation)..."></textarea>
          
          <h3>What's your theory of change?</h3>
          <p>How will incremental changes lead to transformation?</p>
          <textarea class="input-field" placeholder="Example: Visible quick wins will build community engagement → increased awareness creates demand for alternatives → businesses innovate → policy follows → system transforms..."></textarea>
          
          <h3>Key leverage points?</h3>
          <p>Where can small changes create big impact?</p>
          <textarea class="input-field" placeholder="Example: Tourism sector (economic incentive), youth education (future mindset), local businesses (innovation potential)..."></textarea>
        </div>
        
        <div class="section">
          <h2>Action Planning</h2>
          
          <div class="grid-2">
            <div class="grid-box">
              <h3>Next 3 Months</h3>
              <p>Immediate actions (mostly change)</p>
              <textarea class="input-field" placeholder="Quick wins and momentum building..."></textarea>
            </div>
            
            <div class="grid-box">
              <h3>Next Year</h3>
              <p>Bridge actions (change + transformation)</p>
              <textarea class="input-field" placeholder="System interventions and coalition building..."></textarea>
            </div>
            
            <div class="grid-box">
              <h3>Next 3 Years</h3>
              <p>Transformation goals</p>
              <textarea class="input-field" placeholder="System-level changes achieved..."></textarea>
            </div>
            
            <div class="grid-box">
              <h3>Success Vision</h3>
              <p>What does success look like?</p>
              <textarea class="input-field" placeholder="Paint a picture of the transformed future..."></textarea>
            </div>
          </div>
        </div>
        
        ${getFooter()}
      </div>
    </body>
    </html>
  `;
  return html;
};

export const generateSystemsToolkitHTML = (data: HtmlTemplateData): string => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      ${getBaseStyles()}
    </head>
    <body>
      ${getSDGBar()}
      <div class="container">
        ${getHeader(data.title, 'Apply the Iceberg Model and identify leverage points')}
        
        <div class="info-box">
          <p><strong>Name:</strong> ${data.userName || '_______________________'}</p>
          <p><strong>Date:</strong> ${data.date || new Date().toLocaleDateString()}</p>
          <p><strong>Module:</strong> ${data.moduleNumber} - Understanding Complexity</p>
        </div>
        
        <div class="instructions">
          <h4>🧊 How to use the Iceberg Model:</h4>
          <p>1. Start with visible events (tip of the iceberg)</p>
          <p>2. Look for patterns that repeat over time</p>
          <p>3. Identify underlying structures that create patterns</p>
          <p>4. Uncover mental models that maintain structures</p>
          <p>5. Find leverage points where you can intervene</p>
        </div>
        
        <div class="section">
          <h2>Your System Challenge</h2>
          <p>What systemic challenge are you exploring?</p>
          <textarea class="input-field small-input" placeholder="Example: Food waste in our city (SDG 12: Responsible Consumption)"></textarea>
        </div>
        
        <div class="section">
          <h2>The Iceberg Model Analysis</h2>
          
          <div class="iceberg-model">
            <div class="iceberg-level events">
              <h3>🌊 EVENTS (Visible)</h3>
              <p>What happened? What do we see?</p>
              <textarea class="input-field" placeholder="Example: Restaurants throwing away food daily, households discarding expired products, supermarkets dumping unsold items, food left uneaten at events..."></textarea>
              
              <p><strong>Data & Evidence:</strong></p>
              <textarea class="input-field small-input" placeholder="Example: 40% of food wasted, 500 tons per month in our city..."></textarea>
            </div>
            
            <div class="iceberg-level patterns">
              <h3>📈 PATTERNS (Trends)</h3>
              <p>What trends have emerged over time?</p>
              <textarea class="input-field" placeholder="Example: Waste increases during holidays, more waste in affluent areas, peak waste at month-end, increasing trend over past decade..."></textarea>
              
              <p><strong>Recurring Behaviors:</strong></p>
              <textarea class="input-field" placeholder="Example: Over-purchasing, preference for perfect produce, confusion about expiry dates, large portion sizes..."></textarea>
            </div>
            
            <div class="iceberg-level structures">
              <h3>🏗️ STRUCTURES (Systems)</h3>
              <p>What rules, relationships, and infrastructure create these patterns?</p>
              <textarea class="input-field" placeholder="Example: Supermarket aesthetics standards, bulk buying incentives, lack of composting infrastructure, liability laws preventing donation, supply chain inefficiencies..."></textarea>
              
              <p><strong>Policies & Incentives:</strong></p>
              <textarea class="input-field" placeholder="Example: No penalties for waste, tax incentives favor disposal over donation, strict sell-by regulations..."></textarea>
              
              <p><strong>Physical Infrastructure:</strong></p>
              <textarea class="input-field" placeholder="Example: Limited cold storage, no food rescue network, centralized distribution..."></textarea>
            </div>
            
            <div class="iceberg-level mental-models">
              <h3>💭 MENTAL MODELS (Beliefs)</h3>
              <p>What beliefs and values maintain these structures?</p>
              <textarea class="input-field" placeholder="Example: Abundance mindset, perfection expectations, fear of scarcity, status through excess, disconnect from food sources, waste as inevitable..."></textarea>
              
              <p><strong>Cultural Narratives:</strong></p>
              <textarea class="input-field" placeholder="Example: 'Better safe than sorry', 'Customer is always right', 'More is better', 'Old food is dangerous'..."></textarea>
              
              <p><strong>Paradigms:</strong></p>
              <textarea class="input-field" placeholder="Example: Linear economy, consumer culture, growth imperative, human-nature separation..."></textarea>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Leverage Points Analysis</h2>
          <p>Based on Donella Meadows' leverage points, where can you intervene most effectively?</p>
          
          <h3>🔴 Low Leverage (Easier but less impact)</h3>
          <textarea class="input-field" placeholder="Numbers and constants: Reduce price of ugly produce by 30%, increase composting bins by 50%..."></textarea>
          
          <h3>🟡 Medium Leverage (Moderate difficulty and impact)</h3>
          <textarea class="input-field" placeholder="Feedback loops: Food waste tracking apps, public reporting of restaurant waste, rewards for zero-waste achievements..."></textarea>
          
          <h3>🟢 High Leverage (Harder but transformative)</h3>
          <textarea class="input-field" placeholder="Paradigm shifts: Circular food economy, food as sacred, regenerative food systems, community ownership models..."></textarea>
        </div>
        
        <div class="section">
          <h2>Causal Loop Mapping</h2>
          <p>Identify reinforcing and balancing loops in your system:</p>
          
          <h3>Reinforcing Loops (R) - Vicious/Virtuous Cycles</h3>
          <textarea class="input-field" placeholder="Example: More waste → lower food prices → less value perception → more waste (vicious)\nOR: Composting → soil health → local food → community connection → less waste (virtuous)"></textarea>
          
          <h3>Balancing Loops (B) - Stabilizing Forces</h3>
          <textarea class="input-field" placeholder="Example: High waste → public concern → policy pressure → waste reduction initiatives → lower waste → reduced concern"></textarea>
        </div>
        
        <div class="section">
          <h2>Your Intervention Strategy</h2>
          
          <h3>Selected Leverage Points</h3>
          <p>Which 3 leverage points will you target in your jam?</p>
          <ol>
            <li><textarea class="input-field small-input" placeholder="Leverage point 1 and why..."></textarea></li>
            <li><textarea class="input-field small-input" placeholder="Leverage point 2 and why..."></textarea></li>
            <li><textarea class="input-field small-input" placeholder="Leverage point 3 and why..."></textarea></li>
          </ol>
          
          <h3>System Sensing Questions for Your Jam</h3>
          <p>What questions will help participants understand the system?</p>
          <textarea class="input-field" placeholder="Example:\n- Who benefits from the current system?\n- What keeps this problem in place?\n- Where do we see bright spots?\n- What would need to be true for this to change?"></textarea>
          
          <h3>Transformation Hypothesis</h3>
          <p>If we intervene at these leverage points, what system change do we expect?</p>
          <textarea class="input-field" placeholder="Example: By shifting mental models about food value (high leverage) while improving infrastructure (medium) and adjusting prices (low), we can create a reinforcing loop toward zero waste..."></textarea>
        </div>
        
        ${getFooter()}
      </div>
    </body>
    </html>
  `;
  return html;
};

// Function to open template in new window
export const openTemplateInNewWindow = (html: string, title: string) => {
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
    newWindow.document.title = title;
  }
};

// Export all template generators
export const htmlTemplateGenerators = {
  'overview-worksheet': generateOverviewWorksheetHTML,
  'intentions-canvas': generateIntentionsCanvasHTML,
  'host-pledge': generateHostPledgeHTML,
  'complex-matrix': generateComplexMatrixHTML,
  'change-canvas': generateChangeCanvasHTML,
  'systems-toolkit': generateSystemsToolkitHTML
};