// Complete HTML Templates for All Course Modules

export const moduleTemplates = {
  // Module 1 Templates
  'jamkit-checklist': {
    title: 'Jamkit Inventory Checklist',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Jamkit Inventory Checklist</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #00A651; margin-bottom: 30px; }
    .checklist { margin: 20px 0; }
    .category { margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
    .category h3 { color: #333; margin-bottom: 15px; }
    .item { display: flex; align-items: center; margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
    input[type="checkbox"] { margin-right: 15px; width: 20px; height: 20px; }
    .notes { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>🎯 Jamkit Inventory Checklist</h1>
  
  <div class="category">
    <h3>Physical Materials</h3>
    <div class="item">
      <input type="checkbox" id="posters">
      <label for="posters">Posters & Signage</label>
    </div>
    <div class="item">
      <input type="checkbox" id="stickies">
      <label for="stickies">Sticky Notes (multiple colors)</label>
    </div>
    <div class="item">
      <input type="checkbox" id="markers">
      <label for="markers">Markers & Pens</label>
    </div>
    <div class="item">
      <input type="checkbox" id="paper">
      <label for="paper">Flip Charts / Large Paper</label>
    </div>
    <div class="item">
      <input type="checkbox" id="timer">
      <label for="timer">Timer / Stopwatch</label>
    </div>
    <textarea class="notes" placeholder="Additional notes for physical materials..."></textarea>
  </div>

  <div class="category">
    <h3>Digital Resources</h3>
    <div class="item">
      <input type="checkbox" id="templates">
      <label for="templates">Method Templates</label>
    </div>
    <div class="item">
      <input type="checkbox" id="presentation">
      <label for="presentation">Presentation Slides</label>
    </div>
    <div class="item">
      <input type="checkbox" id="miro">
      <label for="miro">Miro/Mural Boards</label>
    </div>
    <div class="item">
      <input type="checkbox" id="music">
      <label for="music">Background Music Playlist</label>
    </div>
    <textarea class="notes" placeholder="Additional digital resources needed..."></textarea>
  </div>

  <div class="category">
    <h3>Venue Requirements</h3>
    <div class="item">
      <input type="checkbox" id="space">
      <label for="space">Adequate Space for Groups</label>
    </div>
    <div class="item">
      <input type="checkbox" id="walls">
      <label for="walls">Wall Space for Posters</label>
    </div>
    <div class="item">
      <input type="checkbox" id="wifi">
      <label for="wifi">WiFi Access</label>
    </div>
    <div class="item">
      <input type="checkbox" id="power">
      <label for="power">Power Outlets</label>
    </div>
    <div class="item">
      <input type="checkbox" id="catering">
      <label for="catering">Refreshments Arranged</label>
    </div>
    <textarea class="notes" placeholder="Venue-specific requirements..."></textarea>
  </div>

  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Print Checklist</button>
</body>
</html>
    `
  },
  
  'intentions-canvas': {
    title: 'Personal Intentions Canvas',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Personal Intentions Canvas</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #00A651; text-align: center; }
    .canvas { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
    .section { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    .section h3 { color: #333; margin-bottom: 15px; }
    textarea { width: 100%; min-height: 120px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; }
    .full-width { grid-column: 1 / -1; }
  </style>
</head>
<body>
  <h1>🌟 Personal Intentions Canvas</h1>
  
  <div class="canvas">
    <div class="section">
      <h3>My Why</h3>
      <p>Why am I hosting a Global Goals Jam?</p>
      <textarea placeholder="What drives me to organize this event? What impact do I want to create?"></textarea>
    </div>
    
    <div class="section">
      <h3>My Strengths</h3>
      <p>What unique skills do I bring?</p>
      <textarea placeholder="What are my facilitation superpowers? What expertise can I share?"></textarea>
    </div>
    
    <div class="section">
      <h3>My Goals</h3>
      <p>What do I want to achieve?</p>
      <textarea placeholder="Personal goals, community goals, impact goals..."></textarea>
    </div>
    
    <div class="section">
      <h3>My Challenges</h3>
      <p>What might be difficult for me?</p>
      <textarea placeholder="What areas need support? What concerns do I have?"></textarea>
    </div>
    
    <div class="section full-width">
      <h3>My Commitment</h3>
      <p>What do I promise to my participants and community?</p>
      <textarea placeholder="I commit to creating a space where..."></textarea>
    </div>
    
    <div class="section full-width">
      <h3>My Support Network</h3>
      <p>Who can help me succeed?</p>
      <textarea placeholder="Co-hosts, mentors, partners, sponsors..."></textarea>
    </div>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Save as PDF</button>
</body>
</html>
    `
  },

  'overview-worksheet': {
    title: 'Jam Overview Planning Worksheet',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Jam Overview Planning Worksheet</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { color: #00A651; }
    .worksheet { margin-top: 30px; }
    .field { margin-bottom: 25px; }
    label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
    input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; }
    textarea { min-height: 100px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  </style>
</head>
<body>
  <h1>📋 Jam Overview Planning Worksheet</h1>
  
  <div class="worksheet">
    <div class="field">
      <label>Event Title</label>
      <input type="text" placeholder="e.g., Berlin Global Goals Jam 2024">
    </div>
    
    <div class="row">
      <div class="field">
        <label>Date</label>
        <input type="date">
      </div>
      <div class="field">
        <label>Duration</label>
        <select>
          <option>2 days (weekend)</option>
          <option>1 day (intensive)</option>
          <option>3 days (extended)</option>
          <option>Half day (sprint)</option>
        </select>
      </div>
    </div>
    
    <div class="field">
      <label>Venue</label>
      <input type="text" placeholder="Location name and address">
    </div>
    
    <div class="row">
      <div class="field">
        <label>Expected Participants</label>
        <input type="number" placeholder="20-30">
      </div>
      <div class="field">
        <label>SDG Focus</label>
        <select>
          <option>All SDGs</option>
          <option>SDG 3: Good Health</option>
          <option>SDG 4: Quality Education</option>
          <option>SDG 11: Sustainable Cities</option>
          <option>SDG 13: Climate Action</option>
        </select>
      </div>
    </div>
    
    <div class="field">
      <label>Event Description</label>
      <textarea placeholder="Describe your jam's unique focus and what participants can expect..."></textarea>
    </div>
    
    <div class="field">
      <label>Target Audience</label>
      <textarea placeholder="Who should attend? Students, professionals, activists, designers..."></textarea>
    </div>
    
    <div class="field">
      <label>Key Partners</label>
      <textarea placeholder="Organizations, sponsors, or collaborators supporting your jam..."></textarea>
    </div>
    
    <div class="field">
      <label>Success Metrics</label>
      <textarea placeholder="How will you measure the impact of your jam?"></textarea>
    </div>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Export Plan</button>
</body>
</html>
    `
  },

  // Module 2 Templates
  'complex-matrix': {
    title: 'Complex vs Complicated Matrix',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Complex vs Complicated Matrix</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #00A651; text-align: center; }
    .matrix { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
    .quadrant { background: #f8f9fa; padding: 25px; border-radius: 8px; min-height: 300px; }
    .quadrant h3 { margin-bottom: 15px; }
    .complicated { border-left: 4px solid #F59E0B; }
    .complex { border-left: 4px solid #00A651; }
    textarea { width: 100%; min-height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .examples { margin-top: 10px; padding: 10px; background: white; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>🔄 Complex vs Complicated Matrix</h1>
  
  <div class="matrix">
    <div class="quadrant complicated">
      <h3>📐 Complicated Problems</h3>
      <p><strong>Characteristics:</strong> Predictable, solvable with expertise, clear cause-effect</p>
      <div class="examples">
        <p><em>Examples: Building a bridge, assembling furniture, following a recipe</em></p>
      </div>
      <textarea placeholder="List complicated challenges in your context..."></textarea>
    </div>
    
    <div class="quadrant complex">
      <h3>🌐 Complex Problems</h3>
      <p><strong>Characteristics:</strong> Unpredictable, emergent, multiple interconnected factors</p>
      <div class="examples">
        <p><em>Examples: Climate change, poverty, community health, education equity</em></p>
      </div>
      <textarea placeholder="List complex challenges in your context..."></textarea>
    </div>
    
    <div class="quadrant complicated">
      <h3>🔧 Complicated Solutions</h3>
      <p><strong>Approach:</strong> Expert knowledge, best practices, step-by-step processes</p>
      <textarea placeholder="What complicated solutions are being applied?"></textarea>
    </div>
    
    <div class="quadrant complex">
      <h3>🔮 Complex Solutions</h3>
      <p><strong>Approach:</strong> Experimentation, adaptation, multiple perspectives, emergence</p>
      <textarea placeholder="What complex approaches could work?"></textarea>
    </div>
  </div>
  
  <div style="margin-top: 30px; padding: 20px; background: #e8f5e9; border-radius: 8px;">
    <h3>💡 Key Insight</h3>
    <textarea placeholder="What's your main learning about complexity in your challenge?" style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Save Matrix</button>
</body>
</html>
    `
  },

  'change-canvas': {
    title: 'Change vs Transformation Canvas',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Change vs Transformation Canvas</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #00A651; text-align: center; }
    .canvas { margin-top: 30px; }
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .side { padding: 25px; border-radius: 8px; }
    .change-side { background: #fff3cd; border: 2px solid #F59E0B; }
    .transform-side { background: #d4edda; border: 2px solid #00A651; }
    h3 { margin-bottom: 15px; }
    textarea { width: 100%; min-height: 120px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .section { margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>🔄 Change vs Transformation Canvas</h1>
  
  <div class="canvas">
    <div class="comparison">
      <div class="side change-side">
        <h3>📊 Change</h3>
        <p><em>Improving what exists</em></p>
        
        <div class="section">
          <label><strong>What stays the same?</strong></label>
          <textarea placeholder="Core structures, systems, assumptions that remain..."></textarea>
        </div>
        
        <div class="section">
          <label><strong>What improves?</strong></label>
          <textarea placeholder="Incremental improvements, optimizations..."></textarea>
        </div>
        
        <div class="section">
          <label><strong>Timeline</strong></label>
          <textarea placeholder="How quickly can this change happen?"></textarea>
        </div>
      </div>
      
      <div class="side transform-side">
        <h3>🚀 Transformation</h3>
        <p><em>Creating something fundamentally new</em></p>
        
        <div class="section">
          <label><strong>What shifts fundamentally?</strong></label>
          <textarea placeholder="New paradigms, structures, ways of being..."></textarea>
        </div>
        
        <div class="section">
          <label><strong>What emerges?</strong></label>
          <textarea placeholder="New possibilities, unexpected outcomes..."></textarea>
        </div>
        
        <div class="section">
          <label><strong>Timeline</strong></label>
          <textarea placeholder="What's the journey of transformation?"></textarea>
        </div>
      </div>
    </div>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px;">
      <h3>🎯 Your Focus</h3>
      <div class="section">
        <label><strong>Where do you need change?</strong></label>
        <textarea placeholder="Quick wins, immediate improvements needed..."></textarea>
      </div>
      
      <div class="section">
        <label><strong>Where do you need transformation?</strong></label>
        <textarea placeholder="Fundamental shifts required for real impact..."></textarea>
      </div>
      
      <div class="section">
        <label><strong>Action Steps</strong></label>
        <textarea placeholder="What will you do differently based on this understanding?"></textarea>
      </div>
    </div>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Export Canvas</button>
</body>
</html>
    `
  },

  'systems-toolkit': {
    title: 'Systems Thinking Toolkit',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Systems Thinking Toolkit</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #00A651; text-align: center; }
    .toolkit { margin-top: 30px; }
    .tool { background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
    .tool h3 { color: #333; margin-bottom: 15px; }
    textarea { width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .connections { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
    .connection-box { background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>🔗 Systems Thinking Toolkit</h1>
  
  <div class="toolkit">
    <div class="tool">
      <h3>1. Identify System Elements</h3>
      <p>What are the key components of your system?</p>
      <div class="connections">
        <div class="connection-box">
          <strong>People</strong>
          <textarea placeholder="Stakeholders, users, communities..."></textarea>
        </div>
        <div class="connection-box">
          <strong>Processes</strong>
          <textarea placeholder="Activities, workflows, cycles..."></textarea>
        </div>
        <div class="connection-box">
          <strong>Resources</strong>
          <textarea placeholder="Materials, funding, information..."></textarea>
        </div>
      </div>
    </div>
    
    <div class="tool">
      <h3>2. Map Relationships</h3>
      <p>How do elements connect and influence each other?</p>
      <textarea placeholder="Draw or describe the connections between elements. What affects what? What feedback loops exist?"></textarea>
    </div>
    
    <div class="tool">
      <h3>3. Find Leverage Points</h3>
      <p>Where can small changes make big differences?</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
        <div>
          <strong>High Impact Areas</strong>
          <textarea placeholder="Where could intervention create ripple effects?"></textarea>
        </div>
        <div>
          <strong>Root Causes</strong>
          <textarea placeholder="What underlying issues drive multiple problems?"></textarea>
        </div>
      </div>
    </div>
    
    <div class="tool">
      <h3>4. Consider Time Delays</h3>
      <p>What happens now vs. later?</p>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
        <div>
          <strong>Immediate Effects</strong>
          <textarea placeholder="What changes right away?"></textarea>
        </div>
        <div>
          <strong>Short-term (Months)</strong>
          <textarea placeholder="What emerges over time?"></textarea>
        </div>
        <div>
          <strong>Long-term (Years)</strong>
          <textarea placeholder="What systemic shifts occur?"></textarea>
        </div>
      </div>
    </div>
    
    <div class="tool" style="background: #e8f5e9;">
      <h3>5. System Intervention Strategy</h3>
      <p>Based on your analysis, what's your approach?</p>
      <textarea placeholder="Describe your intervention strategy considering all system elements, relationships, and leverage points..." style="min-height: 150px;"></textarea>
    </div>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Save Toolkit</button>
</body>
</html>
    `
  },

  // Module 3 Templates
  'open-design-principles': {
    title: 'Open Design Principles Framework',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Open Design Principles Framework</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #00A651; text-align: center; }
    .principles { margin-top: 30px; }
    .principle { background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #00A651; }
    .principle h3 { color: #333; margin-bottom: 10px; }
    .principle p { color: #666; margin-bottom: 15px; }
    textarea { width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .rating { display: flex; gap: 10px; margin-top: 10px; align-items: center; }
    .rating label { margin-right: 10px; }
  </style>
</head>
<body>
  <h1>🌐 Open Design Principles Framework</h1>
  
  <div class="principles">
    <div class="principle">
      <h3>1. Transparency</h3>
      <p>Making processes, decisions, and outcomes visible to all</p>
      <textarea placeholder="How will you ensure transparency in your jam?"></textarea>
      <div class="rating">
        <label>Current Level:</label>
        <input type="range" min="1" max="5" value="3">
        <span>3/5</span>
      </div>
    </div>
    
    <div class="principle">
      <h3>2. Accessibility</h3>
      <p>Ensuring everyone can participate regardless of background or ability</p>
      <textarea placeholder="What barriers will you remove? How will you include diverse voices?"></textarea>
      <div class="rating">
        <label>Current Level:</label>
        <input type="range" min="1" max="5" value="3">
        <span>3/5</span>
      </div>
    </div>
    
    <div class="principle">
      <h3>3. Collaboration</h3>
      <p>Creating spaces for genuine co-creation and shared ownership</p>
      <textarea placeholder="How will participants truly collaborate vs. just participate?"></textarea>
      <div class="rating">
        <label>Current Level:</label>
        <input type="range" min="1" max="5" value="3">
        <span>3/5</span>
      </div>
    </div>
    
    <div class="principle">
      <h3>4. Iteration</h3>
      <p>Embracing continuous improvement and learning from failure</p>
      <textarea placeholder="How will you build in feedback loops and adaptation?"></textarea>
      <div class="rating">
        <label>Current Level:</label>
        <input type="range" min="1" max="5" value="3">
        <span>3/5</span>
      </div>
    </div>
    
    <div class="principle">
      <h3>5. Documentation</h3>
      <p>Capturing and sharing knowledge for others to build upon</p>
      <textarea placeholder="What will you document? How will you share it?"></textarea>
      <div class="rating">
        <label>Current Level:</label>
        <input type="range" min="1" max="5" value="3">
        <span>3/5</span>
      </div>
    </div>
    
    <div class="principle">
      <h3>6. Commons Contribution</h3>
      <p>Giving back to the community and shared resources</p>
      <textarea placeholder="What will you contribute back to the Global Goals Jam community?"></textarea>
      <div class="rating">
        <label>Current Level:</label>
        <input type="range" min="1" max="5" value="3">
        <span>3/5</span>
      </div>
    </div>
  </div>
  
  <div style="background: #e8f5e9; padding: 25px; border-radius: 8px; margin-top: 30px;">
    <h3>📋 Action Plan</h3>
    <p>Based on your assessment, what are your top 3 actions to strengthen open design?</p>
    <textarea placeholder="1. \n2. \n3. " style="min-height: 120px;"></textarea>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Save Framework</button>
</body>
</html>
    `
  },

  'knowledge-sharing-canvas': {
    title: 'Knowledge Sharing Canvas',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Knowledge Sharing Canvas</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1100px; margin: 0 auto; }
    h1 { color: #00A651; text-align: center; }
    .canvas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; }
    .section { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    .section h3 { color: #333; margin-bottom: 10px; font-size: 16px; }
    textarea { width: 100%; min-height: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    .full-width { grid-column: 1 / -1; }
    .two-thirds { grid-column: span 2; }
  </style>
</head>
<body>
  <h1>📚 Knowledge Sharing Canvas</h1>
  
  <div class="canvas">
    <div class="section">
      <h3>What We Know</h3>
      <p style="font-size: 12px; color: #666;">Existing knowledge & expertise</p>
      <textarea placeholder="What knowledge does your team/community already have?"></textarea>
    </div>
    
    <div class="section">
      <h3>What We Need</h3>
      <p style="font-size: 12px; color: #666;">Knowledge gaps & questions</p>
      <textarea placeholder="What do we need to learn or understand better?"></textarea>
    </div>
    
    <div class="section">
      <h3>Who Can Help</h3>
      <p style="font-size: 12px; color: #666;">Experts & resources</p>
      <textarea placeholder="Who has the knowledge we need? Where can we find it?"></textarea>
    </div>
    
    <div class="section two-thirds">
      <h3>Capture Methods</h3>
      <p style="font-size: 12px; color: #666;">How we'll document learning</p>
      <textarea placeholder="Photos, videos, written notes, templates, recordings, sketches..."></textarea>
    </div>
    
    <div class="section">
      <h3>Sharing Channels</h3>
      <p style="font-size: 12px; color: #666;">How we'll distribute</p>
      <textarea placeholder="Website, social media, newsletter, workshop..."></textarea>
    </div>
    
    <div class="section full-width">
      <h3>Knowledge Products</h3>
      <p style="font-size: 12px; color: #666;">What we'll create for others</p>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px;">
        <textarea placeholder="Case Studies"></textarea>
        <textarea placeholder="Method Cards"></textarea>
        <textarea placeholder="Video Tutorials"></textarea>
        <textarea placeholder="Templates"></textarea>
      </div>
    </div>
    
    <div class="section full-width" style="background: #e8f5e9;">
      <h3>Impact Measurement</h3>
      <p style="font-size: 12px; color: #666;">How we'll know our sharing makes a difference</p>
      <textarea placeholder="Downloads, implementations, feedback, stories of use, replications..."></textarea>
    </div>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Export Canvas</button>
</body>
</html>
    `
  },

  'documentation-template': {
    title: 'Jam Documentation Template',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Jam Documentation Template</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { color: #00A651; }
    .section { margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    h2 { color: #333; margin-bottom: 15px; }
    textarea { width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
    .photo-placeholder { background: #ddd; height: 150px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666; }
  </style>
</head>
<body>
  <h1>📸 Jam Documentation Template</h1>
  
  <div class="section">
    <h2>Event Overview</h2>
    <textarea placeholder="Date, location, number of participants, theme/focus..."></textarea>
  </div>
  
  <div class="section">
    <h2>Key Moments</h2>
    <div class="photo-grid">
      <div class="photo-placeholder">Opening Circle</div>
      <div class="photo-placeholder">Ideation</div>
      <div class="photo-placeholder">Prototyping</div>
      <div class="photo-placeholder">Testing</div>
      <div class="photo-placeholder">Presentations</div>
      <div class="photo-placeholder">Celebration</div>
    </div>
    <textarea placeholder="Describe the flow and key moments of your jam..." style="margin-top: 15px;"></textarea>
  </div>
  
  <div class="section">
    <h2>Methods Used</h2>
    <textarea placeholder="List and briefly describe the methods/tools you used..."></textarea>
  </div>
  
  <div class="section">
    <h2>Solutions Developed</h2>
    <textarea placeholder="Describe the solutions/prototypes created by participants..."></textarea>
  </div>
  
  <div class="section">
    <h2>Participant Feedback</h2>
    <textarea placeholder="Key quotes, insights, and feedback from participants..."></textarea>
  </div>
  
  <div class="section">
    <h2>Lessons Learned</h2>
    <textarea placeholder="What worked well? What would you do differently?"></textarea>
  </div>
  
  <div class="section">
    <h2>Next Steps</h2>
    <textarea placeholder="Follow-up actions, implementation plans, future events..."></textarea>
  </div>
  
  <div class="section" style="background: #e8f5e9;">
    <h2>Resources to Share</h2>
    <textarea placeholder="Links to presentations, templates, photos, videos..."></textarea>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Export Documentation</button>
</body>
</html>
    `
  },

  // Module 4 Templates
  'method-selection-guide': {
    title: 'Method Selection Guide',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Method Selection Guide</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #00A651; text-align: center; }
    .guide { margin-top: 30px; }
    .criteria { background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
    .criteria h3 { color: #333; margin-bottom: 15px; }
    .options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
    .option { background: white; padding: 15px; border-radius: 4px; border: 1px solid #ddd; cursor: pointer; }
    .option:hover { border-color: #00A651; background: #e8f5e9; }
    .selected { background: #e8f5e9; border-color: #00A651; }
    textarea { width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>🎯 Method Selection Guide</h1>
  
  <div class="guide">
    <div class="criteria">
      <h3>1. Define Your Challenge</h3>
      <textarea placeholder="What specific challenge are you addressing? Be as clear as possible..."></textarea>
    </div>
    
    <div class="criteria">
      <h3>2. Time Available</h3>
      <div class="options">
        <div class="option">15-30 minutes</div>
        <div class="option">45-60 minutes</div>
        <div class="option">90+ minutes</div>
      </div>
    </div>
    
    <div class="criteria">
      <h3>3. Group Size</h3>
      <div class="options">
        <div class="option">2-5 people</div>
        <div class="option">6-15 people</div>
        <div class="option">16+ people</div>
      </div>
    </div>
    
    <div class="criteria">
      <h3>4. Desired Outcome</h3>
      <div class="options">
        <div class="option">Generate Ideas</div>
        <div class="option">Build Consensus</div>
        <div class="option">Create Prototype</div>
        <div class="option">Map Systems</div>
        <div class="option">Define Problem</div>
        <div class="option">Plan Action</div>
      </div>
    </div>
    
    <div class="criteria">
      <h3>5. Energy Level Needed</h3>
      <div class="options">
        <div class="option">High Energy (Active)</div>
        <div class="option">Medium (Mixed)</div>
        <div class="option">Low Energy (Reflective)</div>
      </div>
    </div>
    
    <div class="criteria" style="background: #e8f5e9;">
      <h3>Recommended Methods</h3>
      <p>Based on your criteria, consider these methods:</p>
      <ul style="margin: 15px 0;">
        <li><strong>Crazy 8s:</strong> Quick ideation for time-pressed sessions</li>
        <li><strong>Journey Mapping:</strong> Understanding user experiences</li>
        <li><strong>How Might We:</strong> Reframing problems as opportunities</li>
        <li><strong>Dot Voting:</strong> Democratic decision making</li>
        <li><strong>Storyboarding:</strong> Visualizing solutions</li>
      </ul>
      <textarea placeholder="Notes on which method(s) you'll use and why..."></textarea>
    </div>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Save Selection</button>
</body>
</html>
    `
  },

  'session-plan-template': {
    title: 'Session Planning Template',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Session Planning Template</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #00A651; }
    .timeline { margin-top: 30px; }
    .time-block { display: grid; grid-template-columns: 100px 1fr 200px; gap: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; margin-bottom: 15px; }
    .time { font-weight: bold; color: #00A651; }
    input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .add-block { background: #00A651; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>⏰ Session Planning Template</h1>
  
  <div class="timeline">
    <div class="time-block">
      <div class="time">9:00 AM</div>
      <div>
        <input type="text" placeholder="Activity: Welcome & Introduction">
        <textarea placeholder="Description: Set the tone, introduce the day, explain the process..." style="margin-top: 10px;"></textarea>
      </div>
      <div>
        <input type="text" placeholder="Materials: Name tags, agenda">
        <input type="text" placeholder="Duration: 15 min" style="margin-top: 10px;">
      </div>
    </div>
    
    <div class="time-block">
      <div class="time">9:15 AM</div>
      <div>
        <input type="text" placeholder="Activity: Ice Breaker">
        <textarea placeholder="Description: Quick energizer to get people connected..." style="margin-top: 10px;"></textarea>
      </div>
      <div>
        <input type="text" placeholder="Materials: None">
        <input type="text" placeholder="Duration: 15 min" style="margin-top: 10px;">
      </div>
    </div>
    
    <div class="time-block">
      <div class="time">9:30 AM</div>
      <div>
        <input type="text" placeholder="Activity: Problem Framing">
        <textarea placeholder="Description: Introduce the challenge, explore different perspectives..." style="margin-top: 10px;"></textarea>
      </div>
      <div>
        <input type="text" placeholder="Materials: Slides, handouts">
        <input type="text" placeholder="Duration: 30 min" style="margin-top: 10px;">
      </div>
    </div>
    
    <div class="time-block">
      <div class="time">10:00 AM</div>
      <div>
        <input type="text" placeholder="Activity: Ideation Session">
        <textarea placeholder="Description: Use Crazy 8s method for rapid idea generation..." style="margin-top: 10px;"></textarea>
      </div>
      <div>
        <input type="text" placeholder="Materials: Paper, markers">
        <input type="text" placeholder="Duration: 45 min" style="margin-top: 10px;">
      </div>
    </div>
    
    <div class="time-block">
      <div class="time">10:45 AM</div>
      <div>
        <input type="text" placeholder="Activity: Break">
        <textarea placeholder="Description: Coffee, snacks, informal networking..." style="margin-top: 10px;"></textarea>
      </div>
      <div>
        <input type="text" placeholder="Materials: Refreshments">
        <input type="text" placeholder="Duration: 15 min" style="margin-top: 10px;">
      </div>
    </div>
  </div>
  
  <button class="add-block" onclick="alert('Add more time blocks as needed')">+ Add Time Block</button>
  
  <div style="margin-top: 30px; padding: 20px; background: #e8f5e9; border-radius: 8px;">
    <h3>Session Notes</h3>
    <textarea placeholder="Key objectives, backup plans, facilitator notes..." style="min-height: 100px;"></textarea>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Export Plan</button>
</body>
</html>
    `
  },

  'materials-checklist': {
    title: 'Materials & Setup Checklist',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Materials & Setup Checklist</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { color: #00A651; }
    .checklist-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .checklist-section h3 { color: #333; margin-bottom: 15px; }
    .item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
    .item:last-child { border-bottom: none; }
    input[type="checkbox"] { margin-right: 15px; width: 18px; height: 18px; }
    .quantity { margin-left: auto; width: 80px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; }
    .notes { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>✅ Materials & Setup Checklist</h1>
  
  <div class="checklist-section">
    <h3>📝 Stationery & Supplies</h3>
    <div class="item">
      <input type="checkbox">
      <label>Sticky Notes (multiple colors)</label>
      <input type="number" class="quantity" placeholder="Qty">
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Markers (thick & thin)</label>
      <input type="number" class="quantity" placeholder="Qty">
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Flip Chart Paper</label>
      <input type="number" class="quantity" placeholder="Qty">
    </div>
    <div class="item">
      <input type="checkbox">
      <label>A4/Letter Paper</label>
      <input type="number" class="quantity" placeholder="Qty">
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Tape/Blue Tack</label>
      <input type="number" class="quantity" placeholder="Qty">
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Scissors</label>
      <input type="number" class="quantity" placeholder="Qty">
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Name Tags</label>
      <input type="number" class="quantity" placeholder="Qty">
    </div>
    <textarea class="notes" placeholder="Additional stationery notes..."></textarea>
  </div>
  
  <div class="checklist-section">
    <h3>💻 Technology</h3>
    <div class="item">
      <input type="checkbox">
      <label>Projector/Screen</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Laptop/Computer</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Speakers (for music/videos)</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Extension Cords</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>WiFi Password Visible</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Camera for Documentation</label>
    </div>
    <textarea class="notes" placeholder="Tech setup notes..."></textarea>
  </div>
  
  <div class="checklist-section">
    <h3>🪑 Room Setup</h3>
    <div class="item">
      <input type="checkbox">
      <label>Tables for Group Work</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Chairs (check count)</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Wall Space for Posting</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Breakout Spaces Identified</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Registration Table</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Signage/Directions</label>
    </div>
    <textarea class="notes" placeholder="Room layout notes..."></textarea>
  </div>
  
  <div class="checklist-section">
    <h3>☕ Catering</h3>
    <div class="item">
      <input type="checkbox">
      <label>Coffee/Tea Setup</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Water Stations</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Morning Snacks</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Lunch Arrangements</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Afternoon Snacks</label>
    </div>
    <div class="item">
      <input type="checkbox">
      <label>Dietary Requirements Checked</label>
    </div>
    <textarea class="notes" placeholder="Catering notes and dietary requirements..."></textarea>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Print Checklist</button>
</body>
</html>
    `
  },

  // Module 5 Templates
  'facilitation-plan': {
    title: 'Advanced Facilitation Plan',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Advanced Facilitation Plan</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #00A651; }
    .plan-section { background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
    .plan-section h3 { color: #333; margin-bottom: 15px; }
    textarea { width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .techniques { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
    .technique-box { background: white; padding: 15px; border-radius: 4px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>🎭 Advanced Facilitation Plan</h1>
  
  <div class="plan-section">
    <h3>Session Overview</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <label><strong>Session Title</strong></label>
        <input type="text" placeholder="Enter session name" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div>
        <label><strong>Duration</strong></label>
        <input type="text" placeholder="e.g., 2 hours" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
    </div>
    <div style="margin-top: 15px;">
      <label><strong>Learning Objectives</strong></label>
      <textarea placeholder="What will participants learn or achieve?"></textarea>
    </div>
  </div>
  
  <div class="plan-section">
    <h3>Energy Management</h3>
    <div class="techniques">
      <div class="technique-box">
        <strong>Opening Energy</strong>
        <textarea placeholder="How will you start with high energy? Ice breaker, energizer, etc."></textarea>
      </div>
      <div class="technique-box">
        <strong>Mid-Session Boost</strong>
        <textarea placeholder="How will you re-energize when energy dips?"></textarea>
      </div>
      <div class="technique-box">
        <strong>Transition Techniques</strong>
        <textarea placeholder="How will you smoothly move between activities?"></textarea>
      </div>
      <div class="technique-box">
        <strong>Closing Energy</strong>
        <textarea placeholder="How will you end on a high note?"></textarea>
      </div>
    </div>
  </div>
  
  <div class="plan-section">
    <h3>Engagement Strategies</h3>
    <div class="technique-box" style="margin-bottom: 15px;">
      <strong>For Visual Learners</strong>
      <textarea placeholder="Diagrams, sketches, color-coding, visual templates..."></textarea>
    </div>
    <div class="technique-box" style="margin-bottom: 15px;">
      <strong>For Auditory Learners</strong>
      <textarea placeholder="Discussions, music, verbal instructions, storytelling..."></textarea>
    </div>
    <div class="technique-box">
      <strong>For Kinesthetic Learners</strong>
      <textarea placeholder="Hands-on activities, movement, building, role-play..."></textarea>
    </div>
  </div>
  
  <div class="plan-section">
    <h3>Difficult Situations Playbook</h3>
    <div class="techniques">
      <div class="technique-box">
        <strong>If someone dominates</strong>
        <textarea placeholder="Your strategy..."></textarea>
      </div>
      <div class="technique-box">
        <strong>If group is silent</strong>
        <textarea placeholder="Your strategy..."></textarea>
      </div>
      <div class="technique-box">
        <strong>If conflict arises</strong>
        <textarea placeholder="Your strategy..."></textarea>
      </div>
      <div class="technique-box">
        <strong>If time runs out</strong>
        <textarea placeholder="Your strategy..."></textarea>
      </div>
    </div>
  </div>
  
  <div class="plan-section" style="background: #e8f5e9;">
    <h3>Facilitation Mantras</h3>
    <p>Your personal reminders for great facilitation:</p>
    <textarea placeholder="• Trust the process\n• Hold space for all voices\n• Stay curious, not judgmental\n• ..."></textarea>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Save Plan</button>
</body>
</html>
    `
  },

  'engagement-techniques': {
    title: 'Engagement Techniques Toolkit',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Engagement Techniques Toolkit</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #00A651; text-align: center; }
    .toolkit { margin-top: 30px; }
    .technique { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #00A651; }
    .technique h3 { color: #333; margin-bottom: 10px; }
    .when-to-use { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
    .how-to { background: white; padding: 15px; border-radius: 4px; margin-top: 10px; }
    .rating { display: flex; gap: 20px; margin-top: 10px; font-size: 14px; }
    .rating span { padding: 4px 8px; background: #e0e0e0; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>🚀 Engagement Techniques Toolkit</h1>
  
  <div class="toolkit">
    <div class="technique">
      <h3>1. Silent Brainstorming</h3>
      <p>Everyone writes ideas silently before sharing</p>
      <div class="when-to-use">
        <strong>When to use:</strong> Group has introverts, power dynamics exist, need many ideas quickly
      </div>
      <div class="how-to">
        <strong>How to:</strong>
        <ol>
          <li>Give everyone sticky notes and markers</li>
          <li>Set timer for 5 minutes of silent writing</li>
          <li>One idea per sticky note</li>
          <li>Post all on wall simultaneously</li>
          <li>Cluster and discuss</li>
        </ol>
      </div>
      <div class="rating">
        <span>⏱ Time: 10-15 min</span>
        <span>👥 Group: Any size</span>
        <span>⚡ Energy: Medium</span>
      </div>
    </div>
    
    <div class="technique">
      <h3>2. Gallery Walk</h3>
      <p>Participants move around to view and comment on work</p>
      <div class="when-to-use">
        <strong>When to use:</strong> Multiple outputs to review, need movement, want peer feedback
      </div>
      <div class="how-to">
        <strong>How to:</strong>
        <ol>
          <li>Post work around the room</li>
          <li>Give participants sticky notes for comments</li>
          <li>Play background music</li>
          <li>15-20 minutes to walk and comment</li>
          <li>Groups present key feedback received</li>
        </ol>
      </div>
      <div class="rating">
        <span>⏱ Time: 20-30 min</span>
        <span>👥 Group: 10+</span>
        <span>⚡ Energy: High</span>
      </div>
    </div>
    
    <div class="technique">
      <h3>3. Think-Pair-Share</h3>
      <p>Individual thinking, then pairs, then full group</p>
      <div class="when-to-use">
        <strong>When to use:</strong> Complex topics, ensure everyone participates, build confidence
      </div>
      <div class="how-to">
        <strong>How to:</strong>
        <ol>
          <li>Pose a question or challenge</li>
          <li>2 minutes individual thinking</li>
          <li>3 minutes discuss in pairs</li>
          <li>5 minutes share with full group</li>
          <li>Capture key insights</li>
        </ol>
      </div>
      <div class="rating">
        <span>⏱ Time: 10-15 min</span>
        <span>👥 Group: Any size</span>
        <span>⚡ Energy: Low-Medium</span>
      </div>
    </div>
    
    <div class="technique">
      <h3>4. Role Storming</h3>
      <p>Brainstorm from different personas' perspectives</p>
      <div class="when-to-use">
        <strong>When to use:</strong> Stuck in conventional thinking, need diverse perspectives
      </div>
      <div class="how-to">
        <strong>How to:</strong>
        <ol>
          <li>Assign different roles (child, CEO, alien, etc.)</li>
          <li>Groups brainstorm from that perspective</li>
          <li>"What would X think about this?"</li>
          <li>Share wildest ideas from each role</li>
          <li>Find unexpected insights</li>
        </ol>
      </div>
      <div class="rating">
        <span>⏱ Time: 20-30 min</span>
        <span>👥 Group: 6-20</span>
        <span>⚡ Energy: High</span>
      </div>
    </div>
    
    <div class="technique">
      <h3>5. Dot Democracy</h3>
      <p>Visual voting with sticky dots</p>
      <div class="when-to-use">
        <strong>When to use:</strong> Need to prioritize, make decisions, see group preferences
      </div>
      <div class="how-to">
        <strong>How to:</strong>
        <ol>
          <li>Display all options clearly</li>
          <li>Give each person 3-5 dots</li>
          <li>Can put multiple dots on one item</li>
          <li>Vote silently</li>
          <li>Discuss patterns that emerge</li>
        </ol>
      </div>
      <div class="rating">
        <span>⏱ Time: 5-10 min</span>
        <span>👥 Group: Any size</span>
        <span>⚡ Energy: Medium</span>
      </div>
    </div>
  </div>
  
  <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-top: 30px;">
    <h3>📝 My Favorite Techniques</h3>
    <textarea placeholder="Note which techniques work best for your style and groups..." style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Save Toolkit</button>
</body>
</html>
    `
  },

  'reflection-guide': {
    title: 'Facilitation Reflection Guide',
    content: `
<!DOCTYPE html>
<html>
<head>
  <title>Facilitation Reflection Guide</title>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { color: #00A651; }
    .reflection { margin-top: 30px; }
    .section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .section h3 { color: #333; margin-bottom: 15px; }
    textarea { width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .rating-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-top: 10px; }
    .rating-scale { display: flex; gap: 10px; align-items: center; }
    .rating-scale input { width: 100%; }
  </style>
</head>
<body>
  <h1>🪞 Facilitation Reflection Guide</h1>
  
  <div class="reflection">
    <div class="section">
      <h3>Session Details</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <input type="text" placeholder="Session/Event Name" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <input type="date" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <input type="text" placeholder="Number of Participants" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <input type="text" placeholder="Duration" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
    </div>
    
    <div class="section">
      <h3>What Went Well? 🌟</h3>
      <textarea placeholder="Celebrate your successes! What worked beautifully? What surprised you positively?"></textarea>
    </div>
    
    <div class="section">
      <h3>Challenges Faced 🤔</h3>
      <textarea placeholder="What was difficult? What didn't go as planned? What caught you off guard?"></textarea>
    </div>
    
    <div class="section">
      <h3>Self-Assessment</h3>
      <div class="rating-grid">
        <label>Energy Management</label>
        <div class="rating-scale">
          <span>1</span>
          <input type="range" min="1" max="5" value="3">
          <span>5</span>
        </div>
        
        <label>Time Management</label>
        <div class="rating-scale">
          <span>1</span>
          <input type="range" min="1" max="5" value="3">
          <span>5</span>
        </div>
        
        <label>Participant Engagement</label>
        <div class="rating-scale">
          <span>1</span>
          <input type="range" min="1" max="5" value="3">
          <span>5</span>
        </div>
        
        <label>Clarity of Instructions</label>
        <div class="rating-scale">
          <span>1</span>
          <input type="range" min="1" max="5" value="3">
          <span>5</span>
        </div>
        
        <label>Handling Unexpected Situations</label>
        <div class="rating-scale">
          <span>1</span>
          <input type="range" min="1" max="5" value="3">
          <span>5</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3>Participant Feedback Highlights</h3>
      <textarea placeholder="What did participants say? Key quotes, common themes, suggestions..."></textarea>
    </div>
    
    <div class="section">
      <h3>Key Learnings 💡</h3>
      <textarea placeholder="What insights did you gain about facilitation? About yourself? About the group?"></textarea>
    </div>
    
    <div class="section" style="background: #e8f5e9;">
      <h3>Next Time I Will...</h3>
      <textarea placeholder="Based on this reflection, what will you do differently? What will you keep doing? What new techniques will you try?"></textarea>
    </div>
    
    <div class="section">
      <h3>Support Needed</h3>
      <textarea placeholder="What help do you need to improve? Training, mentoring, resources, practice opportunities?"></textarea>
    </div>
  </div>
  
  <button onclick="window.print()" style="background: #00A651; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Save Reflection</button>
</body>
</html>
    `
  }
};

export function getTemplate(templateId: string) {
  return moduleTemplates[templateId] || null;
}

export function getAllTemplateIds() {
  return Object.keys(moduleTemplates);
}

export function getTemplatesByModule(moduleNumber: number) {
  const moduleTemplateMap: { [key: number]: string[] } = {
    1: ['jamkit-checklist', 'intentions-canvas', 'overview-worksheet'],
    2: ['complex-matrix', 'change-canvas', 'systems-toolkit'],
    3: ['open-design-principles', 'knowledge-sharing-canvas', 'documentation-template'],
    4: ['method-selection-guide', 'session-plan-template', 'materials-checklist'],
    5: ['facilitation-plan', 'engagement-techniques', 'reflection-guide']
  };
  
  return moduleTemplateMap[moduleNumber] || [];
}