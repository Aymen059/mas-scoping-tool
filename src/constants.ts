import type { Status, SvcStatus, Tag } from './types'

export const S_CYCLE: Status[] = ['in', 'pending', 'excluded', 'optional', 'out']
export const S_LABEL: Record<Status, string> = {
  in: 'IN',
  pending: 'PENDING',
  excluded: 'EXCLUDED',
  optional: 'OPTIONAL',
  out: 'OUT OF SCOPE',
}
export const S_BADGE: Record<Status, string> = {
  in: 'b-in',
  pending: 'b-pending',
  excluded: 'b-excluded',
  optional: 'b-optional',
  out: 'b-out',
}

export const T_BADGE: Record<Tag, string> = {
  gd: 'b-gd',
  md: 'b-md',
  auth: 'b-auth',
  noauth: 'b-noauth',
}
export const T_LABEL: Record<Tag, string> = {
  gd: 'GD',
  md: 'MD',
  auth: 'FedRAMP AUTH',
  noauth: 'Not FedRAMP Auth',
}

export const SVC_CYCLE: SvcStatus[] = ['auth', 'noauth', 'pending', 'out']
export const SVC_DOT: Record<SvcStatus, string> = {
  auth: 'dot-auth',
  noauth: 'dot-noauth',
  pending: 'dot-pending',
  out: 'dot-out',
}
export const SVC_TIP: Record<SvcStatus, string> = {
  auth: 'FedRAMP Authorized',
  noauth: 'Not FedRAMP Authorized',
  pending: 'Pending',
  out: 'Out of scope',
}

export const PRESETS = [
  '#4f46e5', '#16a34a', '#9333ea', '#d97706', '#2563eb',
  '#475569', '#0891b2', '#be185d', '#b45309', '#0f766e',
]
