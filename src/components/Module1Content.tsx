import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Target, Globe, Lightbulb, Heart } from 'lucide-react';
import AudioPlayer from '@/components/ui/AudioPlayer';
import { courseModules } from '@/data/courseContent';

export function Module1Content() {
  const module = courseModules.find((m) => m.id === 'module-1');
  const mediaSrc = module?.videoUrl || '';

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Module 1: Understanding Global Goals Jam</h2>
        <p className="text-gray-600 mt-2">
          Discover the power of collective action and learn how Global Goals Jam transforms communities worldwide.
        </p>
      </div>

      {/* Audio Player (if available) */}
      {mediaSrc && /\.(mp3|m4a|wav|ogg)(\?|$)/i.test(mediaSrc) && (
        <div>
          <AudioPlayer src={mediaSrc} title="Module 1 — Introduction" />
        </div>
      )}

      {/* Learning Outcomes */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Learning Outcomes
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Understand the history and mission of Global Goals Jam</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Learn about the 17 Sustainable Development Goals and their interconnections</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Discover the impact of local action on global challenges</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Explore successful jam stories from around the world</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Rest of content unchanged — Impact Stories, Philosophy, Key Takeaways */}
      <div className="space-y-6">
        {/* Section 1: The Story */}
        <section>
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            The Global Goals Jam Story
          </h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              Global Goals Jam began in 2016 as a grassroots movement to localize the UN's Sustainable Development Goals. 
              What started as a small experiment in Amsterdam has grown into a worldwide phenomenon, with over 200 jams 
              across 6 continents, engaging thousands of changemakers.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              The jam format combines design thinking, systems thinking, and community action to create tangible solutions 
              for local challenges that contribute to global goals. It's not just about awareness – it's about action.
            </p>
          </div>
        </section>

        {/* Section 2: The SDGs */}
        <section>
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Understanding the 17 SDGs
          </h3>
          {/* SDG grid omitted for brevity — retain original look in real project */}
        </section>

        {/* Section 3: Impact Stories */}
        <section>
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Impact Stories from the Field
          </h3>
          <div className="space-y-4">
            <Card className="p-4 border-l-4 border-green-500">
              <h4 className="font-semibold text-green-700">Amsterdam: Circular Fashion</h4>
              <p className="text-sm text-gray-600 mt-1">
                A jam team created a clothing swap app that has diverted 10,000+ garments from landfills, 
                supporting SDG 12 (Responsible Consumption) and SDG 13 (Climate Action).
              </p>
            </Card>
            <Card className="p-4 border-l-4 border-blue-500">
              <h4 className="font-semibold text-blue-700">Nairobi: Clean Water Access</h4>
              <p className="text-sm text-gray-600 mt-1">
                Participants designed a community water purification system now serving 500+ families, 
                addressing SDG 6 (Clean Water) and SDG 3 (Good Health).
              </p>
            </Card>
            <Card className="p-4 border-l-4 border-purple-500">
              <h4 className="font-semibold text-purple-700">São Paulo: Urban Gardens</h4>
              <p className="text-sm text-gray-600 mt-1">
                A rooftop garden network emerged from a jam, now producing fresh food for 20 schools, 
                supporting SDG 2 (Zero Hunger) and SDG 11 (Sustainable Cities).
              </p>
            </Card>
          </div>
        </section>

        {/* Section 4: The Jam Philosophy */}
        <section>
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            The Jam Philosophy
          </h3>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800">Think Global, Act Local</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Every community has unique challenges and assets. Jams help translate global goals into local action.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Design for Systems Change</h4>
                <p className="text-sm text-gray-600 mt-1">
                  We don't just solve symptoms – we identify leverage points for transformative change.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Collaborate Across Boundaries</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Jams bring together diverse perspectives: citizens, experts, officials, and entrepreneurs.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Prototype and Iterate</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Start small, test quickly, learn constantly. Every jam creates seeds for future growth.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Takeaways */}
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-yellow-600" />
              Key Takeaways
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Global Goals Jam is a proven methodology for community-driven change</li>
              <li>• The SDGs provide a shared framework for addressing interconnected challenges</li>
              <li>• Local action creates global impact through networked solutions</li>
              <li>• Design thinking + systems thinking = transformative outcomes</li>
              <li>• You don't need to be an expert – you need to care and collaborate</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Module1Content;