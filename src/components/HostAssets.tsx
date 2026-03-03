import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Download, FileText, Image as ImageIcon, FolderDown, BookOpen, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'

const STORAGE_BASE = 'https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets'

export default function HostAssets() {
  const files = {
    brandPack: `${STORAGE_BASE}/GGJ_assets.zip`,
    brandExtras: `${STORAGE_BASE}/GGJ_extra_assets.zip`,
    instructionGuide: `${STORAGE_BASE}/ggj_info_booklet.pdf`,
    impactReport: `${STORAGE_BASE}/GGJimpactreport_compressed.pdf`,
  }

  return (
    <div className="space-y-6">
      {/* Intro */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Host Assets</h3>
              <p className="text-muted-foreground">Official GGJ brand packs and facilitation guides. Use these files for your local Jam communications and delivery.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" disabled>
                <FolderDown className="w-4 h-4" />
                Download All (coming soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Brand */}
        <Card className="hover:shadow-soft transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" /> Brand Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Logo packs, visual elements, and brand files for Global Goals Jam.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <a href={files.brandPack} target="_blank" rel="noopener noreferrer" download>
                  <Download className="w-4 h-4" /> GGJ Assets Pack (.zip)
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href={files.brandExtras} target="_blank" rel="noopener noreferrer" download>
                  <Download className="w-4 h-4" /> Extra Assets (.zip)
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instruction Guide */}
        <Card className="hover:shadow-soft transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Instruction Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Global Goals Jam Instruction Guide — full overview and instructions for running a Jam.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="gap-2 bg-primary-solid text-white hover:bg-primary/90">
                <a href={files.instructionGuide} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-4 h-4" /> View PDF
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href={files.instructionGuide} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Impact Report */}
        <Card className="hover:shadow-soft transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Impact Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Comprehensive GGJ impact report — key results, outcomes, and stories from Global Goals Jam events.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="gap-2 bg-primary-solid text-white hover:bg-primary/90">
                <a href={files.impactReport} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-4 h-4" /> View PDF
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href={files.impactReport} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
