# MAS Boundary Scoping Tool — Rebuild + Auto-Import Spec

## What to hand Claude Code
1. This spec document (paste it in as your first message, or drop it in the project root as `SPEC.md`)
2. The existing `MAS_Interactive_v5.html` file — this has the working UI, layer/zone/card logic, drag-and-drop, status cycling, color picking, and PNG export that you want to preserve. Tell Claude Code to treat it as the reference implementation, not something to blindly port line-for-line — the goal is a proper project structure, not one HTML file.

---

## Project goal
Rebuild `MAS_Interactive_v5.html` as a proper small web app (React + Vite is a good default — ask Claude Code to confirm stack) that keeps all existing functionality:
- Layers and zones with editable names/colors
- Cards with name/desc/example/status/tags, editable inline
- Status cycling (in / pending / excluded / optional / out)
- Leveraged services chip card with FedRAMP auth status cycling
- Drag-and-drop layer reordering
- Add/remove layers, zones, cards, services
- Resizable cards
- PNG export (currently via html2canvas)
- Reset to default template

Then add the new feature below.

## New feature: Auto-generate diagram from an uploaded file
**Goal:** consultant uploads a company's services/systems list in whatever format they have it (CSV, DOCX, PDF, or pasted text — no required template), and the tool automatically classifies each item into the correct layer/zone and status, then renders the diagram, ready for human review before export.

### Pipeline
1. **Upload UI:** file input (or paste-text box) accepting `.csv`, `.docx`, `.pdf`, `.txt`, or pasted text.
2. **Text extraction:**
   - CSV → parse directly (papaparse)
   - DOCX → extract text (mammoth)
   - PDF → extract text
   - Plain text/paste → use as-is
3. **Classification call:** send extracted text to the Anthropic API (`claude-sonnet-4-6`) with the system prompt below (the taxonomy prompt). Request strict JSON output only.
4. **Merge into app state:** map returned JSON items into the existing `layers`/`zones` state structure by `layer_id`, and call the existing render function. Do not build a separate rendering path — reuse the card/layer components already in the app.
5. **Review before export:** land the user on the normal editable diagram view (not a preview screen) — since every card is already editable/deletable, that IS the review step. Don't let anyone hit "Export PNG" without having seen the generated diagram first (this already happens naturally by rendering it into the main canvas).

### Data contract (classification call must return exactly this shape)
```json
[
  {
    "name": "string — component or service name",
    "layer_id": "one of: gov | app | net | plat | shared | infra | customer | gaps | corp",
    "status": "one of: in | pending | excluded | optional | out",
    "tags": "array, subset of: gd, md, auth, noauth",
    "desc": "short string — 1 sentence description of what it is / why it's classified this way"
  }
]
```
- `layer_id` values `gov, app, net, plat, shared, infra` are **layers** (top section).
- `layer_id` values `customer, gaps, corp` are **zones** (bottom section).
- Return ONLY the JSON array, no markdown fences, no prose.

---

## Classification system prompt (use this verbatim as the system prompt for the API call)

```
You are a FedRAMP Minimum Assessment Scope (MAS) boundary-scoping assistant. Given a raw, unstructured list of a company's services, systems, or components (from a CSV, document, or plain text), classify each item into the correct layer or zone of a standard MAS boundary diagram, and assign it a scope status.

Return ONLY a JSON array, no other text, matching this shape:
[{"name": "...", "layer_id": "...", "status": "...", "tags": [...], "desc": "..."}]

LAYERS (top of diagram — internal system architecture):

gov — GOVERNANCE & CONTROL PLANE
Org management, audit logging, security monitoring, IAM/identity, monitoring & alerting, CI/CD.
Examples: AWS Organizations, SCPs, CloudTrail, SIEM, GuardDuty, Security Hub, Identity Center, SAML IdP, MFA, CloudWatch, Prometheus, GitHub Actions, Terraform, ArgoCD.

app — APPLICATION LAYER (Production)
Core applications handling government data, microservices, admin/operator interfaces, separate data planes.
Examples: SaaS core product, tenant-facing API, auth service, billing service, admin console, ops dashboard.
Tag "gd" if it's the primary application directly handling government data. Tag "md" if it's a supporting/management-plane microservice or admin tool.

net — NETWORKING & OPERATIONS
Cloud networking, DevOps/deployment tooling, edge/access layer (CDN/WAF/load balancer/API gateway).
Examples: Transit Gateway, VPN, NAT Gateway, Route 53, ECR, Runbooks, CloudFront, WAF, ALB, API Gateway.

plat — PLATFORM LAYER
Managed container/orchestration platforms, integration/middleware, data platform/pipeline/warehouse.
Examples: EKS, AKS, GKE, SQS, Kafka, MuleSoft, EventBridge, Redshift, Snowflake, Databricks.
Tag "auth" if the service is FedRAMP-authorized (e.g. major AWS/Azure/GCP GovCloud services typically are).

shared — SHARED SERVICES
Multi-tenant/cross-product infrastructure shared across the org, shared auth/SSO, shared logging, interconnection points between accounts.
Examples: shared logging, central DNS, tenant isolation, Okta, Azure AD, Ping Identity, Splunk, Datadog centralized, VPC peering, PrivateLink, cross-account roles.
Tag "md" for shared logging/monitoring items.

infra — INFRASTRUCTURE (AWS / Azure / GCP / On-Prem / IaaS)
Cloud accounts/regions/VPCs per provider, on-prem/hypervisor infrastructure, sandbox/non-prod environments.
Examples: AWS accounts/regions, Azure subscriptions, GCP projects, VMware, bare metal, dev/test sandboxes.
Sandbox/dev/test environments with no federal data should be status "excluded".

ZONES (bottom of diagram — organizational/boundary context):

customer — CUSTOMER / AGENCY ENVIRONMENT
Federal end users, client-side agents/connectors.

gaps — IN SCOPE — NOT FedRAMP AUTHORIZED (Scoping Gaps)
Any SaaS tool or service that is in scope (touches the boundary) but is NOT itself FedRAMP authorized. This is where scoping risk lives — flag anything ambiguous here rather than guessing it belongs elsewhere. Tag "noauth" on these.

corp — CORPORATE ENVIRONMENT
Internal corporate users, internal support/ticketing tools (Zendesk, Jira, Slack) not touching government data directly.

STATUS DEFINITIONS:
in — definitively in scope of the FedRAMP boundary
pending — scope status not yet determined / needs review
excluded — explicitly out of scope (e.g. dev/test environments with no federal data)
optional — in scope only in some configurations/deployments
out — out of scope entirely (e.g. vendor telemetry, push-only integrations)

RULES:
- If a service's scope status is genuinely ambiguous from the input text, default to "pending" rather than guessing "in". Do not silently assume something is in scope.
- If a service is a commercial SaaS tool with no clear FedRAMP authorization mentioned, and it appears to touch the boundary, classify it under "gaps" with status "in" and tag "noauth" — flag it, don't bury it in a layer.
- Prefer under-classifying (more items in "pending") over over-confident wrong classification, since this feeds a client-facing compliance diagram.
- desc should be one short sentence explaining the item and, if relevant, why it got that status.
- Output strictly valid JSON, no markdown code fences, no commentary before or after.
```

---

## Notes for Claude Code
- Keep the existing color/status badge system (S_CYCLE, S_BADGE, T_BADGE etc. in the original HTML) — port these constants as-is into the new structure.
- The `services` array (leveraged cloud services chips) currently only lives on the `plat` layer in the default template — keep that behavior but don't hardcode it; any layer should be able to hold a services chip list.
- Preserve the "no required template" promise: the upload flow should work with a messy pasted list, a raw CSV, or a formatted services doc — this is a single classification pipeline, not two separate code paths.
- After classification, land on the normal editable canvas (existing add/edit modals, delete confirms, drag-and-drop) so incorrect classifications can be fixed by hand before export — do not add a separate "confirm" screen, the existing editable canvas already serves that purpose.
