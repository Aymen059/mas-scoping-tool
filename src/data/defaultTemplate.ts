import type { LayerData, ZoneData } from '../types'

export const DEFAULT_LAYERS: LayerData[] = [
  {
    id: 'gov', name: 'GOVERNANCE & CONTROL PLANE', color: '#4f46e5', cards: [
      { id: 'g1', name: 'Management', desc: '[Org management service]', eg: 'e.g. AWS Org, SCPs, Org CloudTrail', status: 'in', tags: [] },
      { id: 'g2', name: 'Logging', desc: '[Audit logging service]', eg: 'e.g. CloudTrail, SIEM, S3, KMS', status: 'in', tags: [] },
      { id: 'g3', name: 'Security', desc: '[Security monitoring tool]', eg: 'e.g. GuardDuty, Security Hub, Config', status: 'in', tags: [] },
      { id: 'g4', name: 'IAM / Identity', desc: '[Identity & access service]', eg: 'e.g. Identity Center, SAML IdP, MFA', status: 'in', tags: [] },
      { id: 'g5', name: 'Monitoring & Alerting', desc: '[Monitoring tool]', eg: 'e.g. CloudWatch, Prometheus, SIEM', status: 'in', tags: [] },
      { id: 'g6', name: 'CI/CD', desc: '[Deployment pipeline / IaC tool]', eg: 'e.g. GitHub Actions, Terraform, ArgoCD', status: 'pending', tags: [] },
    ],
  },
  {
    id: 'app', name: 'APPLICATION LAYER (Production)', color: '#d97706', cards: [
      { id: 'a1', name: 'Core Applications', desc: '[Primary application handling gov data]', eg: 'e.g. SaaS core product, tenant-facing API', status: 'in', tags: ['gd'] },
      { id: 'a2', name: 'Microservices', desc: '[Individual microservices / APIs]', eg: 'e.g. auth svc, billing svc, notification svc', status: 'in', tags: ['md'] },
      { id: 'a3', name: 'Operator / Admin Applications', desc: '[Vendor-built admin interfaces]', eg: 'e.g. admin console, ops dashboard, mgmt API', status: 'in', tags: ['md'] },
      { id: 'a4', name: 'App Plane / Data Plane', desc: '[If separate from control plane]', eg: 'e.g. separate data processing plane', status: 'optional', tags: [] },
    ],
  },
  {
    id: 'net', name: 'NETWORKING & OPERATIONS', color: '#16a34a', cards: [
      { id: 'n1', name: 'Network', desc: '[Cloud networking service]', eg: 'e.g. Transit GW, VPN, NAT GW, Route 53 · Interconnections between cloud accounts', status: 'in', tags: [] },
      { id: 'n2', name: 'DevOps / Operations', desc: '[Container registry / deployment tooling]', eg: 'e.g. ECR, Terraform, Runbooks, automation', status: 'in', tags: [] },
      { id: 'n3', name: 'Edge / Access Layer', desc: '[CDN / WAF / Load Balancer / API Gateway]', eg: 'e.g. CloudFront, WAF, ALB, API GW · Note FedRAMP auth per service', status: 'in', tags: [] },
    ],
  },
  {
    id: 'plat', name: 'PLATFORM LAYER', color: '#9333ea',
    cards: [
      { id: 'p1', name: 'Cloud Platform Services', desc: '[Managed container / orchestration platform]', eg: 'e.g. EKS, AKS, GKE · FedRAMP-authorized', status: 'in', tags: ['auth'] },
      { id: 'p2', name: 'Integration / Middleware', desc: '[Message bus / event streaming / iPaaS]', eg: 'e.g. SQS, Kafka, MuleSoft, EventBridge', status: 'in', tags: [] },
      { id: 'p3', name: 'Data Platform', desc: '[Data pipeline / warehouse / analytics]', eg: 'e.g. Redshift, Snowflake, Databricks', status: 'in', tags: [] },
    ],
    services: [
      { id: 'sv1', name: 'AWS Lambda', status: 'auth' },
      { id: 'sv2', name: 'AWS Cognito', status: 'auth' },
      { id: 'sv3', name: 'AWS S3', status: 'auth' },
      { id: 'sv4', name: 'AWS RDS', status: 'auth' },
      { id: 'sv5', name: 'AWS CloudWatch', status: 'auth' },
      { id: 'sv6', name: '[Add service...]', status: 'pending' },
    ],
  },
  {
    id: 'shared', name: 'SHARED SERVICES', color: '#2563eb', cards: [
      { id: 's1', name: 'Shared Infrastructure', desc: '[Multi-tenant / cross-product services]', eg: 'e.g. shared logging, central DNS, tenant isolation', status: 'in', tags: [] },
      { id: 's2', name: 'Auth / SSO Services', desc: '[Shared identity / auth provider]', eg: 'e.g. Okta, Azure AD, Ping Identity', status: 'in', tags: [] },
      { id: 's3', name: 'Shared Logging / Monitoring', desc: '[Central log aggregation]', eg: 'e.g. Splunk, Datadog, CloudWatch centralized', status: 'in', tags: ['md'] },
      { id: 's4', name: 'Interconnection Points', desc: '[APIs / data sharing between accounts]', eg: 'e.g. VPC peering, PrivateLink, cross-account roles', status: 'in', tags: [] },
    ],
  },
  {
    id: 'infra', name: 'INFRASTRUCTURE — AWS / Azure / GCP / On-Prem / IaaS', color: '#475569', cards: [
      { id: 'i1', name: 'AWS Environment', desc: '[AWS accounts / regions / VPCs]', eg: 'e.g. us-east-1 prod, GovCloud', status: 'in', tags: [] },
      { id: 'i2', name: 'Azure Environment', desc: '[Subscriptions / resource groups]', eg: 'e.g. Azure Gov, commercial subscriptions', status: 'in', tags: [] },
      { id: 'i3', name: 'GCP Environment', desc: '[Projects / org / folders]', eg: 'e.g. Assured Workloads, GCP projects', status: 'in', tags: [] },
      { id: 'i4', name: 'On-Prem / IaaS', desc: '[Physical servers / hypervisors / VMs]', eg: 'e.g. VMware, bare metal, co-location', status: 'in', tags: [] },
      { id: 'i5', name: 'Sandbox / Non-Prod', desc: '[Dev / test only — no federal data]', eg: 'e.g. dev sandbox, test environment', status: 'excluded', tags: [] },
    ],
  },
]

export const DEFAULT_ZONES: ZoneData[] = [
  {
    id: 'customer', name: 'CUSTOMER / AGENCY ENV.', color: '#1d4ed8', bgColor: '#eff6ff', borderColor: '#3b82f6', headerColor: '#dbeafe', titleColor: '#1e40af', cards: [
      { id: 'c1', name: 'Federal User', desc: '[Agency staff / end users]', eg: 'e.g. agency employees, federal staff', status: 'in', tags: [] },
      { id: 'c2', name: 'Agent / Connector', desc: '[Client-side agent / connector]', eg: 'e.g. on-prem connector, client agent', status: 'in', tags: [] },
    ],
  },
  {
    id: 'gaps', name: 'IN SCOPE — NOT FedRAMP AUTHORIZED (Scoping Gaps)', color: '#ea580c', bgColor: '#fff7ed', borderColor: '#f97316', borderDash: true, headerColor: '#ffedd5', titleColor: '#c2410c', cards: [
      { id: 'sg1', name: '[SaaS Tool A]', desc: '[Use case / description]', eg: 'e.g. SMS notifications', status: 'in', tags: ['noauth'] },
      { id: 'sg2', name: '[SaaS Tool B]', desc: '[Use case / description]', eg: 'e.g. identity provider', status: 'in', tags: ['noauth'] },
      { id: 'sg3', name: '[SaaS Tool C]', desc: '[Use case / description]', eg: 'e.g. deployment tooling', status: 'pending', tags: [] },
      { id: 'sg4', name: '[Out of MAS Scope]', desc: '[CSP telemetry / push-only]', eg: 'e.g. vendor analytics', status: 'out', tags: [] },
    ],
  },
  {
    id: 'corp', name: 'CORPORATE ENVIRONMENT', color: '#9333ea', bgColor: '#fdf4ff', borderColor: '#a855f7', headerColor: '#f3e8ff', titleColor: '#6b21a8', cards: [
      { id: 'co1', name: 'Corporate User', desc: '[Employee / admin staff]', eg: 'e.g. internal employees, support staff', status: 'in', tags: [] },
      { id: 'co2', name: 'Support System', desc: '[Internal ticketing / tooling]', eg: 'e.g. Zendesk, Jira, Slack', status: 'in', tags: [] },
    ],
  },
]
