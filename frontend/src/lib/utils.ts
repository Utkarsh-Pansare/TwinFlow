import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(n: number, currency = '₹') {
  return `${currency}${n.toLocaleString('en-IN')}`
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    'on-track': 'emerald', 'in-transit': 'sky', 'delayed': 'amber',
    'at-risk': 'rose', 'delivered': 'emerald', 'critical': 'rose',
  }
  return map[status.toLowerCase()] ?? 'slate'
}
