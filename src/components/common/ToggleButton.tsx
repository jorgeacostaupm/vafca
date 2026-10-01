import { Button, type ButtonProps } from 'antd'

type ToggleButtonProps = Omit<ButtonProps, 'type' | 'color' | 'variant' | 'danger' | 'ghost' | 'aria-pressed'> & {
  active: boolean
}

export default function ToggleButton({ active, className = '', ...props }: ToggleButtonProps) {
  return <Button {...props} type="default" className={`app-toggle-button ${className}`} aria-pressed={active} />
}
