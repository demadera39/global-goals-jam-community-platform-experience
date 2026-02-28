import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'

interface SDGCardProps {
  sdgNumber: number
  title: string
  description: string
  colorClass: string
  challenge?: string
  isSelected?: boolean
  onClick?: () => void
}

export default function SDGCard({ 
  sdgNumber, 
  title, 
  description, 
  colorClass, 
  challenge,
  isSelected = false,
  onClick 
}: SDGCardProps) {
  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      {/* SDG Color Header */}
      <div className={`h-16 ${colorClass} flex items-center justify-center relative`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative text-white font-bold text-2xl">
          {sdgNumber}
        </div>
        <div className="absolute top-2 right-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-sm text-foreground leading-tight">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        </div>

        {challenge && (
          <div className="pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              Challenge Focus
            </Badge>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {challenge}
            </p>
          </div>
        )}

        {/* UN SDG Logo placeholder */}
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-muted-foreground">
            UN SDG {sdgNumber}
          </div>
          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-primary rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}