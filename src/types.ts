export type Status = 'in' | 'pending' | 'excluded' | 'optional' | 'out'
export type Tag = 'gd' | 'md' | 'auth' | 'noauth'
export type SvcStatus = 'auth' | 'noauth' | 'pending' | 'out'

export interface CardData {
  id: string
  name: string
  desc: string
  eg: string
  status: Status
  tags: Tag[]
}

export interface ServiceData {
  id: string
  name: string
  status: SvcStatus
}

export interface LayerData {
  id: string
  name: string
  color: string
  cards: CardData[]
  services?: ServiceData[]
}

export interface ZoneData {
  id: string
  name: string
  color: string
  bgColor: string
  borderColor: string
  headerColor: string
  titleColor: string
  borderDash?: boolean
  fixedWidth?: string
  cards: CardData[]
}

export interface MetaFields {
  consultant: string
  client: string
  date: string
}

export type LayerId = 'gov' | 'app' | 'net' | 'plat' | 'shared' | 'infra'
export type ZoneId = 'customer' | 'gaps' | 'corp'

/** Item shape returned by the classification API — a functional category (rendered as a card)
 * or a specific named product (rendered as a Leveraged Cloud Services chip). */
export type ClassifiedItem =
  | { type: 'component'; name: string; layer_id: LayerId | ZoneId; status: Status; tags: Tag[]; desc: string }
  | { type: 'service'; name: string; layer_id: LayerId; service_status: SvcStatus; tags: Tag[]; desc: string }
