import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Target, Users, TrendingUp, Network, Handshake, Rocket, Globe, Building, MessageSquare, MapPin } from 'lucide-react';

const Module7Content = () => {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-8">
        <Badge className="mb-4 bg-emerald-600">Module 7</Badge>
        <h1 className="text-4xl font-bold mb-4">Community Growth & Scaling</h1>
        <p className="text-xl text-gray-700">Develop strategies to grow your host community, build sustainable partnerships, and scale your impact while maintaining quality and local relevance.</p>
      </div>

      {/* Video Section - Removed empty video */}
      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            The Growth Mindset for Jam Hosts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Growing your jam community isn't just about reaching more people—it's about creating sustainable systems that amplify impact while preserving the quality and authenticity that makes your jams effective.</p>
          
          <div className="bg-emerald-50 p-4 rounded-lg">
            <h4 className="font-semibold text-emerald-900 mb-2">Sustainable Growth Principles</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-emerald-800 mb-1">Quality First</h5>
                <p className="text-emerald-700">Maintain high standards even as you scale. Better to have fewer, high-impact jams than many mediocre ones.</p>
              </div>
              <div>
                <h5 className="font-medium text-emerald-800 mb-1">Local Relevance</h5>
                <p className="text-emerald-700">Ensure growth strategies respect and enhance local context rather than imposing external models.</p>
              </div>
              <div>
                <h5 className="font-medium text-emerald-800 mb-1">Community-Led</h5>
                <p className="text-emerald-700">Build growth from within the community rather than through top-down expansion.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            Identifying Your Growth Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Different communities have different pathways to growth. Identify the channels that work best in your context:</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">🎓 Educational Institutions</h4>
                <ul className="text-sm space-y-1">
                  <li>• Universities and colleges</li>
                  <li>• Business schools and MBA programs</li>
                  <li>• Design and innovation schools</li>
                  <li>• Continuing education programs</li>
                  <li>• Student sustainability clubs</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Benefits: Built-in audience, academic credibility, student energy</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">🏢 Corporate Partnerships</h4>
                <ul className="text-sm space-y-1">
                  <li>• CSR and sustainability departments</li>
                  <li>• Innovation labs and R&D teams</li>
                  <li>• Employee volunteer programs</li>
                  <li>• Leadership development initiatives</li>
                  <li>• Diversity and inclusion programs</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Benefits: Resources, professional networks, implementation capacity</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">🏛️ Government & Public Sector</h4>
                <ul className="text-sm space-y-1">
                  <li>• Local government innovation teams</li>
                  <li>• Public policy departments</li>
                  <li>• Community development agencies</li>
                  <li>• Environmental departments</li>
                  <li>• Youth and education ministries</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Benefits: Policy influence, public legitimacy, scaling potential</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">🌱 NGOs & Civil Society</h4>
                <ul className="text-sm space-y-1">
                  <li>• Environmental organizations</li>
                  <li>• Social justice groups</li>
                  <li>• Community development NGOs</li>
                  <li>• Youth organizations</li>
                  <li>• Faith-based communities</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Benefits: Mission alignment, community trust, grassroots networks</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">💡 Innovation Ecosystems</h4>
                <ul className="text-sm space-y-1">
                  <li>• Startup incubators and accelerators</li>
                  <li>• Co-working spaces</li>
                  <li>• Innovation hubs and labs</li>
                  <li>• Maker spaces and fab labs</li>
                  <li>• Tech communities and meetups</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Benefits: Entrepreneurial mindset, technical skills, rapid prototyping</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">🌐 Digital Communities</h4>
                <ul className="text-sm space-y-1">
                  <li>• Social media groups and pages</li>
                  <li>• Professional networks (LinkedIn)</li>
                  <li>• Online sustainability communities</li>
                  <li>• Local Facebook groups</li>
                  <li>• Specialized forums and platforms</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Benefits: Low cost, wide reach, targeted audiences</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partnership Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-purple-600" />
            Building Strategic Partnerships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Effective partnerships are the foundation of sustainable growth. Here's how to identify, approach, and maintain valuable partnerships:</p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold mb-1">Identify Mutual Value</h4>
                <p className="text-sm text-muted-foreground mb-2">Look for organizations whose goals align with yours and who can benefit from what you offer.</p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-1">What You Can Offer</h5>
                    <ul className="space-y-1 text-purple-800">
                      <li>• Innovation methodology and facilitation</li>
                      <li>• Community engagement and activation</li>
                      <li>• SDG expertise and frameworks</li>
                      <li>• Network of changemakers</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-1">What You Need</h5>
                    <ul className="space-y-1 text-purple-800">
                      <li>• Participants and audience</li>
                      <li>• Venue and logistics support</li>
                      <li>• Funding and resources</li>
                      <li>• Local knowledge and connections</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold mb-1">Start Small and Build Trust</h4>
                <p className="text-sm text-muted-foreground mb-2">Begin with low-risk collaborations that demonstrate value before proposing larger partnerships.</p>
                <ul className="text-sm space-y-1">
                  <li>• Offer a free workshop or presentation</li>
                  <li>• Collaborate on a small event or initiative</li>
                  <li>• Provide expertise for their existing programs</li>
                  <li>• Share resources and knowledge</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold mb-1">Formalize Successful Relationships</h4>
                <p className="text-sm text-muted-foreground mb-2">Once you've proven value, create formal agreements that benefit both parties.</p>
                <ul className="text-sm space-y-1">
                  <li>• Regular jam hosting agreements</li>
                  <li>• Co-branded events and programs</li>
                  <li>• Resource sharing arrangements</li>
                  <li>• Joint funding applications</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="font-semibold mb-1">Maintain and Nurture Partnerships</h4>
                <p className="text-sm text-muted-foreground mb-2">Strong partnerships require ongoing attention and mutual support.</p>
                <ul className="text-sm space-y-1">
                  <li>• Regular check-ins and communication</li>
                  <li>• Shared success celebration</li>
                  <li>• Continuous value creation</li>
                  <li>• Adaptation to changing needs</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scaling Models */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-red-600" />
            Models for Scaling Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>There are different approaches to scaling your jam impact. Choose the model that best fits your context and resources:</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">🎯 Intensive Model: Deeper Impact</h4>
              <p className="text-sm text-red-800 mb-2">Focus on fewer participants but create more intensive, transformative experiences.</p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Characteristics</h5>
                  <ul className="space-y-1 text-red-700">
                    <li>• Multi-day or multi-session programs</li>
                    <li>• Smaller cohorts (10-20 participants)</li>
                    <li>• Deep skill building and mentorship</li>
                    <li>• Long-term follow-up and support</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Best For</h5>
                  <ul className="space-y-1 text-red-700">
                    <li>• Training future hosts</li>
                    <li>• Leadership development programs</li>
                    <li>• Complex challenge areas</li>
                    <li>• High-stakes initiatives</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📈 Extensive Model: Broader Reach</h4>
              <p className="text-sm text-blue-800 mb-2">Reach more people with shorter, focused experiences that create awareness and initial engagement.</p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Characteristics</h5>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Single-day or half-day events</li>
                    <li>• Larger groups (30-100 participants)</li>
                    <li>• Awareness and inspiration focus</li>
                    <li>• Streamlined methods and materials</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Best For</h5>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Community awareness campaigns</li>
                    <li>• Corporate team building</li>
                    <li>• Conference and event integration</li>
                    <li>• Movement building</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">🌐 Network Model: Distributed Impact</h4>
              <p className="text-sm text-green-800 mb-2">Train others to host jams in their own contexts, creating a network of local hosts.</p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Characteristics</h5>
                  <ul className="space-y-1 text-green-700">
                    <li>• Train-the-trainer programs</li>
                    <li>• Standardized methods and materials</li>
                    <li>• Ongoing support and community</li>
                    <li>• Quality assurance systems</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Best For</h5>
                  <ul className="space-y-1 text-green-700">
                    <li>• Geographic expansion</li>
                    <li>• Organizational scaling</li>
                    <li>• Sustainable growth</li>
                    <li>• Local adaptation needs</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">🔄 Hybrid Model: Flexible Approach</h4>
              <p className="text-sm text-purple-800 mb-2">Combine different approaches based on context, audience, and objectives.</p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Characteristics</h5>
                  <ul className="space-y-1 text-purple-700">
                    <li>• Multiple program formats</li>
                    <li>• Pathway from awareness to expertise</li>
                    <li>• Flexible resource allocation</li>
                    <li>• Adaptive to opportunities</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Best For</h5>
                  <ul className="space-y-1 text-purple-700">
                    <li>• Diverse community needs</li>
                    <li>• Multiple funding sources</li>
                    <li>• Experimental approaches</li>
                    <li>• Resource optimization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Assurance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Maintaining Quality While Scaling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>The biggest challenge in scaling is maintaining the quality and impact that made your jams successful in the first place. Here's how to scale without losing your essence:</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-semibold text-indigo-900 mb-2">Core Standards and Guidelines</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Non-Negotiable Elements</h5>
                  <ul className="space-y-1 text-indigo-800">
                    <li>• SDG focus and alignment</li>
                    <li>• Participatory and inclusive approach</li>
                    <li>• Action-oriented outcomes</li>
                    <li>• Systems thinking integration</li>
                    <li>• Open sharing of results</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Adaptable Elements</h5>
                  <ul className="space-y-1 text-indigo-800">
                    <li>• Specific methods and activities</li>
                    <li>• Duration and format</li>
                    <li>• Local context and examples</li>
                    <li>• Language and cultural adaptation</li>
                    <li>• Technology and tools used</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Training and Support Systems</h4>
              <ul className="text-sm space-y-1 text-yellow-800">
                <li>• Comprehensive host training programs</li>
                <li>• Mentorship and peer learning networks</li>
                <li>• Regular check-ins and feedback sessions</li>
                <li>• Resource libraries and toolkits</li>
                <li>• Community of practice platforms</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Feedback and Improvement Loops</h4>
              <ul className="text-sm space-y-1 text-green-800">
                <li>• Standardized evaluation forms and metrics</li>
                <li>• Regular host reflection and learning sessions</li>
                <li>• Participant feedback collection and analysis</li>
                <li>• Continuous improvement processes</li>
                <li>• Best practice sharing and documentation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sustainability Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-teal-600" />
            Building Sustainable Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Sustainable growth requires thinking beyond immediate expansion to create systems that can thrive long-term:</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-teal-900">💰 Financial Sustainability</h4>
                <ul className="text-sm space-y-1">
                  <li>• Diversified funding sources</li>
                  <li>• Fee-for-service models where appropriate</li>
                  <li>• Corporate sponsorship and partnerships</li>
                  <li>• Grant funding for specific initiatives</li>
                  <li>• Community fundraising and support</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-teal-900">👥 Human Resource Sustainability</h4>
                <ul className="text-sm space-y-1">
                  <li>• Host development and succession planning</li>
                  <li>• Volunteer recruitment and retention</li>
                  <li>• Skills development and capacity building</li>
                  <li>• Recognition and appreciation systems</li>
                  <li>• Burnout prevention and support</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-teal-900">🏗️ Organizational Sustainability</h4>
                <ul className="text-sm space-y-1">
                  <li>• Clear governance and decision-making</li>
                  <li>• Documented processes and procedures</li>
                  <li>• Technology systems and infrastructure</li>
                  <li>• Legal structure and compliance</li>
                  <li>• Risk management and contingency planning</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-teal-900">🌱 Impact Sustainability</h4>
                <ul className="text-sm space-y-1">
                  <li>• Long-term participant engagement</li>
                  <li>• Integration with existing initiatives</li>
                  <li>• Policy and systems change focus</li>
                  <li>• Community ownership and leadership</li>
                  <li>• Continuous learning and adaptation</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <p className="text-sm"><strong>Quality over quantity:</strong> Focus on creating meaningful impact rather than just reaching more people.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <p className="text-sm"><strong>Build strategic partnerships:</strong> Identify organizations with aligned goals and mutual value propositions.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <p className="text-sm"><strong>Choose your scaling model:</strong> Select intensive, extensive, network, or hybrid approaches based on your context.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <p className="text-sm"><strong>Maintain core standards:</strong> Define non-negotiable elements while allowing for local adaptation.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <p className="text-sm"><strong>Plan for sustainability:</strong> Build financial, human, organizational, and impact sustainability from the start.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <p className="text-sm"><strong>Create feedback loops:</strong> Establish systems for continuous learning and improvement as you scale.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Module7Content;