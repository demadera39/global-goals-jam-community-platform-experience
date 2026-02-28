// Module-specific HTML templates for Global Goals Jam Host Certification Course

import { SDG_COLORS } from './htmlTemplates';

const getBaseStyles = () => `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; background: white; padding: 0; }
    .sdg-bar { display: flex; height: 8px; width: 100%; margin-bottom: 2rem; }
    .sdg-color { flex: 1; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
    .header { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #e0e0e0; }
    .logo { font-size: 0.875rem; color: #666; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 1rem; }
    h1 { font-size: 2rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; font-weight: 600; color: #2c3e50; margin: 1.5rem 0 1rem; }
    h3 { font-size: 1.25rem; font-weight: 600; color: #34495e; margin: 1.25rem 0 0.75rem; }
    .subtitle { font-size: 1.125rem; color: #666; margin-bottom: 1rem; }
    .info-box { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
    .info-box p { margin: 0.25rem 0; color: #555; }
    .section { margin: 2rem 0; page-break-inside: avoid; }
    .input-field { width: 100%; min-height: 100px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical; margin: 0.5rem 0 1rem; background: #fafafa; }
    .input-field:focus { outline: none; border-color: #4CAF50; background: white; }
    .small-input { min-height: 50px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0; }
    .grid-box { border: 2px solid #e0e0e0; border-radius: 8px; padding: 1.5rem; background: #fafafa; }
    .grid-box h3 { margin-top: 0; color: #2c3e50; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.5rem; margin-bottom: 1rem; }
    .checkbox-group { margin: 1rem 0; }
    .checkbox-item { display: flex; align-items: flex-start; margin: 0.75rem 0; }
    .checkbox-item input[type="checkbox"] { width: 20px; height: 20px; margin-right: 12px; margin-top: 2px; cursor: pointer; }
    .checkbox-item label { flex: 1; cursor: pointer; color: #444; }
    .timeline { position: relative; padding-left: 40px; margin: 2rem 0; }
    .timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #ddd; }
    .timeline-item { position: relative; margin-bottom: 2rem; }
    .timeline-item::before { content: ''; position: absolute; left: -30px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #4CAF50; border: 2px solid white; box-shadow: 0 0 0 2px #ddd; }
    .method-card { border: 2px solid #e0e0e0; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; background: white; }
    .method-card h4 { color: #2c3e50; margin-bottom: 0.5rem; }
    .sprint-phase { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; }
    .sprint-phase h3 { color: white; margin-top: 0; }
    .facilitation-tip { background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
    .facilitation-tip h5 { color: #856404; margin-bottom: 0.5rem; }
    .stakeholder-map { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin: 2rem 0; }
    .stakeholder-group { background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 1rem; }
    .stakeholder-group h4 { color: #495057; margin-bottom: 0.5rem; font-size: 1rem; }
    .impact-matrix { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 1px; background: #ccc; border: 2px solid #999; border-radius: 8px; overflow: hidden; margin: 1.5rem 0; min-height: 400px; }
    .impact-cell { background: white; padding: 1.5rem; position: relative; }
    .impact-label { font-weight: 600; color: #2c3e50; margin-bottom: 0.5rem; }
    .footer { margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #e0e0e0; text-align: center; color: #666; font-size: 0.875rem; }
    @media print { body { padding: 0; } .container { max-width: 100%; padding: 1rem; } .input-field { background: white; border: 1px solid #999; } .no-print { display: none; } }
  </style>
`;

const getSDGBar = () => `
  <div class="sdg-bar">
    ${SDG_COLORS.map(color => `<div class="sdg-color" style="background: ${color};"></div>`).join('')}
  </div>
`;

const getHeader = (title: string, subtitle?: string) => `
  <div class="header">
    <div class="logo">GLOBAL GOALS JAM</div>
    <h1>${title}</h1>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
  </div>
`;

const getFooter = () => `
  <div class="footer">
    <p>Global Goals Jam Host Certification Course</p>
    <p>© ${new Date().getFullYear()} Global Goals Jam. This work is licensed under Creative Commons.</p>
  </div>
`;

export const generateOpenDesignPrinciplesHTML = (): string => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Open Design Principles Worksheet</title>
    ${getBaseStyles()}
  </head>
  <body>
    ${getSDGBar()}
    <div class="container">
      ${getHeader('Open Design Principles Worksheet', 'Apply open design thinking to your jam')}
      <div class="info-box">
        <p><strong>Module:</strong> 3 - Open Design & Knowledge Sharing</p>
        <p>This worksheet helps you plan how to make your jam outputs open and accessible.</p>
      </div>
      <div class="section">
        <h2>Part 1: Understanding Open Design</h2>
        <p>Open design means making all jam outputs freely available for others to use, adapt, and build upon.</p>
        <h3>Core Principles Assessment</h3>
        <div class="checkbox-group">
          <div class="checkbox-item"><input type="checkbox" id="principle1" /><label for="principle1"><strong>Transparency:</strong> All processes and decisions are documented and shared</label></div>
          <div class="checkbox-item"><input type="checkbox" id="principle2" /><label for="principle2"><strong>Accessibility:</strong> Outputs are available in formats everyone can use</label></div>
          <div class="checkbox-item"><input type="checkbox" id="principle3" /><label for="principle3"><strong>Adaptability:</strong> Solutions can be modified for different contexts</label></div>
          <div class="checkbox-item"><input type="checkbox" id="principle4" /><label for="principle4"><strong>Attribution:</strong> Credit is given to all contributors</label></div>
          <div class="checkbox-item"><input type="checkbox" id="principle5" /><label for="principle5"><strong>Collaboration:</strong> Multiple perspectives are welcomed and integrated</label></div>
        </div>
      </div>
      ${getFooter()}
    </div>
  </body>
  </html>
`;

export const generateKnowledgeSharingCanvasHTML = (): string => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Knowledge Sharing Canvas</title>
    ${getBaseStyles()}
  </head>
  <body>
    ${getSDGBar()}
    <div class="container">
      ${getHeader('Knowledge Sharing Canvas', 'Plan your documentation and dissemination strategy')}
      <div class="info-box">
        <p><strong>Module:</strong> 3 - Open Design & Knowledge Sharing</p>
        <p>Map out how knowledge from your jam will be captured, packaged, and shared.</p>
      </div>
      <div class="section">
        <h2>Knowledge Capture</h2>
        <div class="grid-3">
          <div class="grid-box"><h3>Before Jam</h3><textarea class="input-field" placeholder="Research, preparation materials, participant briefings..."></textarea></div>
          <div class="grid-box"><h3>During Jam</h3><textarea class="input-field" placeholder="Ideas, prototypes, discussions, breakthrough moments..."></textarea></div>
          <div class="grid-box"><h3>After Jam</h3><textarea class="input-field" placeholder="Reflections, implementations, follow-ups, impacts..."></textarea></div>
        </div>
      </div>
      ${getFooter()}
    </div>
  </body>
  </html>
`;

export const generateJamkitChecklistHTML = (): string => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jamkit Preparation Checklist</title>
    ${getBaseStyles()}
  </head>
  <body>
    ${getSDGBar()}
    <div class="container">
      ${getHeader('Jamkit Preparation Checklist', 'Ensure you have everything ready for your jam')}
      <div class="info-box">
        <p><strong>Module:</strong> 4 - The Jamkit: Your Complete Toolkit</p>
        <p>Use this checklist to prepare all materials and resources for your Global Goals Jam.</p>
      </div>
      <div class="section">
        <h2>Essential Materials</h2>
        <h3>Physical Materials</h3>
        <div class="checkbox-group">
          <div class="checkbox-item"><input type="checkbox" id="mat1" /><label for="mat1">Sticky notes (multiple colors, 500+ sheets)</label></div>
          <div class="checkbox-item"><input type="checkbox" id="mat2" /><label for="mat2">Markers (thick and thin, multiple colors)</label></div>
          <div class="checkbox-item"><input type="checkbox" id="mat3" /><label for="mat3">Large paper sheets / flip charts (20+)</label></div>
          <div class="checkbox-item"><input type="checkbox" id="mat4" /><label for="mat4">Masking tape / blue tack</label></div>
          <div class="checkbox-item"><input type="checkbox" id="mat5" /><label for="mat5">Timer / stopwatch</label></div>
          <div class="checkbox-item"><input type="checkbox" id="mat6" /><label for="mat6">Name tags and lanyards</label></div>
          <div class="checkbox-item"><input type="checkbox" id="mat7" /><label for="mat7">SDG cards or posters</label></div>
          <div class="checkbox-item"><input type="checkbox" id="mat8" /><label for="mat8">Method cards (printed)</label></div>
          <div class="checkbox-item"><input type="checkbox" id="mat9" /><label for="mat9">Prototyping materials (cardboard, scissors, glue)</label></div>
          <div class="checkbox-item"><input type="checkbox" id="mat10" /><label for="mat10">Camera for documentation</label></div>
        </div>
      </div>
      ${getFooter()}
    </div>
  </body>
  </html>
`;

export const generateMethodSelectionGuideHTML = (): string => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Method Selection Guide</title>
    ${getBaseStyles()}
  </head>
  <body>
    ${getSDGBar()}
    <div class="container">
      ${getHeader('Method Selection Guide', 'Choose the right methods for each sprint phase')}
      <div class="info-box"><p><strong>Module:</strong> 4 - The Jamkit: Your Complete Toolkit</p><p>Select appropriate methods based on your challenge, participants, and context.</p></div>
      <div class="section">
        <h2>Your Jam Context</h2>
        <div class="grid-3">
          <div class="grid-box"><h3>Challenge Type</h3><textarea class="input-field small-input" placeholder="Environmental, social, economic..."></textarea></div>
          <div class="grid-box"><h3>Participant Mix</h3><textarea class="input-field small-input" placeholder="Students, professionals, citizens..."></textarea></div>
          <div class="grid-box"><h3>Group Size</h3><textarea class="input-field small-input" placeholder="20-30 people, 5 teams..."></textarea></div>
        </div>
      </div>
      <div class="section">
        <h2>Method Selection by Sprint</h2>
        <div class="sprint-phase"><h3>Sprint 1: UNDERSTAND</h3><p>Goal: Develop deep understanding of the challenge</p>
          <div class="method-card"><h4>□ Stakeholder Mapping</h4><p>When to use: Complex challenges with multiple actors</p><p>Time: 30 minutes | Materials: Large paper, sticky notes</p></div>
          <div class="method-card"><h4>□ Journey Mapping</h4><p>When to use: Understanding user experiences</p><p>Time: 45 minutes | Materials: Timeline template, markers</p></div>
          <div class="method-card"><h4>□ 5 Whys</h4><p>When to use: Getting to root causes</p><p>Time: 20 minutes | Materials: Flip chart</p></div>
          <div class="method-card"><h4>□ Systems Mapping</h4><p>When to use: Understanding interconnections</p><p>Time: 60 minutes | Materials: Large wall space, yarn</p></div>
        </div>
        <div class="sprint-phase" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);"><h3>Sprint 2: IDEATE</h3><p>Goal: Generate diverse solution ideas</p>
          <div class="method-card"><h4>□ Brainstorming</h4><p>When to use: Quick idea generation</p><p>Time: 15 minutes | Materials: Sticky notes</p></div>
          <div class="method-card"><h4>□ Crazy 8s</h4><p>When to use: Visual idea exploration</p><p>Time: 8 minutes | Materials: Paper, pens</p></div>
          <div class="method-card"><h4>□ SCAMPER</h4><p>When to use: Systematic idea generation</p><p>Time: 30 minutes | Materials: SCAMPER prompts</p></div>
          <div class="method-card"><h4>□ Reverse Brainstorming</h4><p>When to use: Stuck groups, difficult challenges</p><p>Time: 25 minutes | Materials: Flip chart</p></div>
        </div>
        <div class="sprint-phase" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);"><h3>Sprint 3: PROTOTYPE</h3><p>Goal: Make ideas tangible</p>
          <div class="method-card"><h4>□ Paper Prototyping</h4><p>When to use: Digital solutions, apps</p><p>Time: 45 minutes | Materials: Paper, markers</p></div>
          <div class="method-card"><h4>□ Role Play</h4><p>When to use: Service design, experiences</p><p>Time: 30 minutes | Materials: Props, scenarios</p></div>
          <div class="method-card"><h4>□ Storyboarding</h4><p>When to use: Communicating user journeys</p><p>Time: 40 minutes | Materials: Template, drawings</p></div>
          <div class="method-card"><h4>□ Mock-up Building</h4><p>When to use: Physical products, spaces</p><p>Time: 60 minutes | Materials: Cardboard, tape</p></div>
        </div>
        <div class="sprint-phase" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);"><h3>Sprint 4: TEST</h3><p>Goal: Get feedback and iterate</p>
          <div class="method-card"><h4>□ Feedback Grid</h4><p>When to use: Structured feedback collection</p><p>Time: 20 minutes | Materials: Grid template</p></div>
          <div class="method-card"><h4>□ Usability Testing</h4><p>When to use: Digital prototypes</p><p>Time: 30 minutes | Materials: Prototype, tasks</p></div>
          <div class="method-card"><h4>□ Field Testing</h4><p>When to use: Physical products or public interventions</p><p>Time: Variable | Materials: Prototype, observation checklist</p></div>
          <div class="method-card"><h4>□ Rapid Iteration</h4><p>When to use: Quick changes based on feedback</p><p>Time: 15-60 minutes | Materials: Materials for fast prototyping</p></div>
        </div>
      </div>
      ${getFooter()}
    </div>
  </body>
  </html>
`;

export const moduleTemplateGenerators: Record<string, (...args: any[]) => string> = {
  'open-design-principles': () => generateOpenDesignPrinciplesHTML(),
  'knowledge-sharing-canvas': () => generateKnowledgeSharingCanvasHTML(),
  'jamkit-checklist': () => generateJamkitChecklistHTML(),
  'method-selection-guide': () => generateMethodSelectionGuideHTML()
};

// end of file
