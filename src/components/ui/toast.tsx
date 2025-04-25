
import * as React from "react"

export interface ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
  variant?: "default" | "destructive";
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export type ToastActionElement = React.ReactElement<{
  className?: string;
  altText?: string;
}>

export function Toast({ title, description, action }: ToastProps) {
  return (
    <div className="group toast-group">
      <div className="toast">
        {title && <div className="toast-title">{title}</div>}
        {description && <div className="toast-description">{description}</div>}
        {action && <div className="toast-action">{action}</div>}
      </div>
    </div>
  )
}
