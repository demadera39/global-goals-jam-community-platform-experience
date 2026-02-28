import { Button, ButtonProps } from './ui/button'
import { Link } from 'react-router-dom'

interface DonateButtonProps extends Omit<ButtonProps, 'onClick'> {
  amount?: number
  tier?: string
  className?: string
}

export default function DonateButton({ 
  amount,
  tier,
  variant = 'default',
  size = 'default',
  className = '',
  ...props 
}: DonateButtonProps) {
  const linkTo = amount ? `/donate?amount=${amount}&tier=${tier}` : '/donate'
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      asChild
      {...props}
    >
      <Link to={linkTo}>
        {amount ? `Donate ${amount}` : 'Support us (Donate)'}
      </Link>
    </Button>
  )
}
