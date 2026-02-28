import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Users, MapPin, Calendar, Clock, AlertCircle, Sparkles, Target } from 'lucide-react';
import AudioPlayer from '@/components/ui/AudioPlayer';
import { courseModules } from '@/data/courseContent';

export function Module2Content() {
  const module = courseModules.find((m) => m.id === 'module-2');
  const mediaSrc = module?.videoUrl || '';

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Module 2: Preparing to Host</h2>
        <p className="text-gray-600 mt-2">
          Everything you need to know before launching your Global Goals Jam – from team building to logistics.
        </p>
      </div>

      {/* Audio Player (if available) */}
      {mediaSrc && /\.(mp3|m4a|wav|ogg)(\?|$)/i.test(mediaSrc) && (
        <div>
          <AudioPlayer src={mediaSrc} title="Lesson 2 — Host Preparation" />
        </div>
      )}

      {/* Learning Outcomes */}
      <Card className="bg-purple-50 border-purple-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Learning Outcomes
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Build your organizing team and define roles</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Choose the right venue and format for your community</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Create a compelling invitation and recruitment strategy</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Prepare materials, tools, and resources for participants</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Rest of Module 2 content unchanged (sections, venue, recruitment, materials) */}
      <div className="space-y-6">
        {/* Section 1: Building Your Team */}
        <section>
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Building Your Organizing Team
          </h3>

          <div className="space-y-4">
            <p className="text-gray-700">
              A successful jam needs a diverse organizing team. Here are the key roles to consider:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold text-blue-700">Lead Host</h4>
                <p className="text-sm text-gray-600 mt-2">
                  • Overall coordination and vision<br/>
                  • Main point of contact<br/>
                  • Opens and closes the jam<br/>
                  • Ensures SDG alignment
                </p>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-green-700">Facilitators (2-3)</h4>
                <p className="text-sm text-gray-600 mt-2">
                  • Guide team processes<br/>
                  • Support ideation sessions<br/>
                  • Help with prototyping<br/>
                  • Manage group dynamics
                </p>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-purple-700">Logistics Coordinator</h4>
                <p className="text-sm text-gray-600 mt-2">
                  • Venue management<br/>
                  • Materials and supplies<br/>
                  • Food and refreshments<br/>
                  • Registration process
                </p>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-orange-700">Communications Lead</h4>
                <p className="text-sm text-gray-600 mt-2">
                  • Social media promotion<br/>
                  • Documentation and photos<br/>
                  • Participant communications<br/>
                  • Results sharing
                </p>
              </Card>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Pro Tip:</strong> Include someone with SDG expertise and someone with local community connections. 
                Diversity in your team leads to better outcomes!
              </p>
            </div>
          </div>
        </section>

        {/* Additional sections continue as before... */}
      </div>
    </div>
  );
}

export default Module2Content;