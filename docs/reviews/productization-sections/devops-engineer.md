# DevOps / Platform Engineering Review — Helm Productization Plan

**Reviewer:** Senior DevOps & Platform Engineer
**Documents reviewed:** `docs/PRODUCTIZATION.md` §5 (technical architecture) and §6 (make-it-real checklist); `docs/PRODUCTIZATION-TASKS.md` cross-cutting section
**Verdict:** CONDITIONAL

---

## Summary verdict

The plan is honest about the demo-to-prod gap and names the right categories. But the treatment of each ops concern is a one-liner in a checklist where each item warrants a week of work and several of them are compliance-class risks that can stop the business cold. The infra row in §5 ("containerized deploy, CI/CD, logging/metrics/tracing, backups, secrets, PII + GST/tax compliance, rate limits") compresses about six months of production-engineering work into a single table cell. That compression is the core problem.

The plan is conditionally approvable because the foundational technical choices (Medusa on Postgres, Node/TS Helm service, Razorpay) are sound. But three categories — multi-tenant isolation, payments/compliance, and webhook reliability — must be treated as first-class build tracks, not checklist items, before a real brand's money and customer data live in this system.

---

## Must-fix before any real brand goes live

### 1. Multi-tenant isolation is specified, not designed

The plan says "row-level security or schema-per-tenant" with no decision between them. These are not equivalent choices — they are different threat models, migration strategies, and ops burdens. Schema-per-tenant gives hard namespace isolation (a query bug in tenant A literally cannot touch tenant B's rows) at the cost of migration fan-out (every `ALTER TABLE` must run N times across N schemas). Row-level security on a shared schema is operationally simpler but requires every query in Medusa, in the Helm service, AND in any raw SQL or reporting path to carry the tenant filter — one missing `WHERE tenant_id = $1` is a cross-tenant data leak.

The blast radius of a tenant-isolation bug in this product is severe: a D2C brand's customer PII (names, addresses, phone numbers), their orders, and their payment reconciliation data all live in the same database. A leak exposes the business to DPDP enforcement, customer trust destruction, and potential liability to Razorpay/payment networks. The plan must make a hard architectural decision here, document the trust boundary, and include a penetration-test scenario for cross-tenant read access before Phase 1 goes live.

Recommendation: for a startup with a small engineering team, schema-per-tenant is the safer choice despite migration overhead — a bug in the isolation layer shows up as "schema not found" rather than silent cross-tenant data bleed. Enforce it at the connection-pool level (each request gets a connection scoped to `SET search_path = tenant_<id>`), not only at the ORM layer.

### 2. Razorpay / PCI / DPDP compliance is not a checklist item

The plan lists "PII + GST/tax compliance" as a single infra row. This bundles three distinct compliance tracks that each require dedicated attention:

**Razorpay PCI scope:** Helm is processing card data through Razorpay's hosted checkout, which keeps the merchant out of PCI-DSS scope — but only if the integration is done correctly (no card data in Helm's own logs, no card numbers in webhook payloads stored to the DB, Razorpay's iframe/redirect flow not bypassed). Any custom checkout component that renders a card field directly moves Helm into PCI scope. The plan must explicitly confirm the integration pattern and add a CI check that blocks logging of any field named `card_number`, `cvv`, `expiry`, or their variants.

**India DPDP Act (Digital Personal Data Protection Act, 2023):** This is not future regulation — it has passed Parliament. For a SaaS holding customer PII (name, address, phone, order history) on behalf of D2C brands, Helm is a Data Processor under the Act. Obligations include: documented purpose limitation per data category, consent management (can't use customer data for one brand's marketing if collected by another), data principal rights (right to erasure, right to correction — these require actual deletion/correction APIs, not just UI), and mandatory breach notification to CERT-In within 72 hours. None of this is in the checklist. A data-erasure API is not a Phase 3 nice-to-have — it is a legal obligation from day one of holding real customer data.

**GST e-invoicing:** The plan does list IRN/QR in Phase 1, which is correct. But GST e-invoicing for B2C orders has a separate flow from B2B, and the IRN generation has a retry/idempotency requirement (if the IRN API call fails mid-order, the order must not be left in a half-invoiced state). This connects directly to the webhook/idempotency problem below.

### 3. Webhooks and background jobs: "idempotent" is not enough — there is no retry/dead-letter design

The checklist says "idempotent webhooks + background jobs (the 'overnight run' must actually run)." This is correct as a principle but vastly under-specified for a system moving real money and real fulfilment.

Helm will receive webhooks from at minimum: Razorpay (payment captured, payment failed, refund processed), Shiprocket/Delhivery (label created, shipped, out-for-delivery, delivered, RTO initiated, RTO returned), and optionally Amazon/Flipkart SP-APIs. Each of these:

- Can arrive out of order (a `delivered` event can arrive before `shipped` due to aggregator retry delays)
- Can arrive multiple times (aggregators retry on 5xx or timeout; a webhook processed twice must produce the same DB state)
- Can be delayed by hours during aggregator incidents

The "overnight run" for SCALE's courier scorecard retraining, ledger reconciliation, and GST return preparation must be a proper job queue (BullMQ or similar, backed by Redis), not a cron that runs a function. A cron that fails silently leaves the scorecard stale, the ledger unreconciled, and the GST data incomplete. The plan needs: a job queue with retry backoff and dead-letter queue, alerting on dead-letter accumulation, and a documented recovery procedure for "the overnight job failed for 3 consecutive nights."

A Razorpay payment webhook that fails to process is not a logging problem — it is money that hasn't been recorded. The blast radius is: order marked as pending, customer re-attempts payment (double charge risk), courier label not generated, brand loses the sale.

### 4. Self-host is not realistic for a non-technical D2C founder without a managed installer

The plan offers `docker compose up` as the self-host path. The actual compose stack is: Postgres + Medusa + Helm service + Next.js storefront + Redis (for job queue) + a cron/job runner. That is five services with startup-order dependencies, secret injection (Razorpay keys, Shiprocket API keys, GST API credentials, SMTP), and a domain/SSL configuration step that requires DNS knowledge.

A non-technical D2C founder who can barely deploy a Shopify theme will abandon this within 30 minutes. The self-host path needs either: (a) a single-binary installer or a fully scripted setup wizard that handles SSL via Let's Encrypt, prompts for API keys interactively, and validates the configuration before starting, or (b) honest documentation that self-host targets technical users and the founder-friendly path is Helm Cloud. Both are valid — but the plan implies self-host is a first-class path for the "just starting" persona, which is false without significant installer engineering.

The ops burden also applies to upgrades: a self-hosted Helm running Medusa 2.x will need a database migration path when Medusa ships a breaking change. Without a `helm-upgrade` CLI that runs migrations safely (with a pre-migration backup, a dry-run, and a rollback path), self-hosted installations will drift and break.

### 5. Observability and DR are absent from the plan

The infra row mentions "logging/metrics/tracing" but there is no SLO defined, no alerting design, no on-call model, and no DR plan. For a product handling customer orders and payments:

- **Minimum viable observability:** structured JSON logs shipped to a log aggregator (not stdout on a single server), error rate and p95 latency tracked per endpoint, Razorpay webhook processing lag as a business metric (if this goes above 60 seconds, a human must be paged).
- **Backup and recovery:** Postgres backups must be automated (daily minimum, WAL archiving for point-in-time recovery), restoration must be tested (an untested backup is not a backup), and the RTO/RPO must be documented. For a business's order data, a 24-hour RPO is probably acceptable in early stage; a 24-hour RTO is probably not.
- **Secrets management:** The plan mentions secrets in the infra row. For Phase 1, at minimum: no secrets in the docker-compose.yml committed to the repo, all production secrets in a secrets manager (AWS Secrets Manager / GCP Secret Manager / Doppler), and a rotation schedule for Razorpay keys and shipping aggregator credentials. A leaked Razorpay API key with write access can initiate refunds.

---

## What the checklist gets right

The plan correctly identifies the demo→prod gap. The decision to adopt Medusa rather than build a commerce backend is the right call — it avoids re-implementing cart/order/inventory logic that has already been battle-tested. The phased approach (Phase 0 = de-brand without a backend, Phase 1 = real backend + one AI loop) is operationally sensible and reduces risk. The acknowledgment that the AI is rules-first before ML is the correct production posture.

---

## The single most underestimated ops item

**DPDP Act compliance.** Every other item on the checklist is an engineering problem — hard, time-consuming, but solvable with known patterns. DPDP is a legal obligation that attaches the moment the first real customer's name and address enters the system. Data-erasure flows, consent records, breach-notification procedures, and the data processor agreement with each D2C brand (who is the Data Fiduciary under the Act) must be designed before Phase 1, not retrofitted when a brand asks "can you delete this customer's data?" The current checklist lists it as "GDPR/DPDP (India) data-handling" — a single parenthetical. That is the highest-risk line item in the entire document.

---

## Infra/ops recommendation

1. **Decide schema-per-tenant vs RLS now.** Document the decision, the enforcement layer, and the cross-tenant test scenario. Do not proceed to Phase 1 without this.
2. **Treat DPDP as a Phase 1 requirement.** Build data-erasure and consent-record APIs before the first real customer's data enters the system. Draft the Data Processor Agreement template for brands.
3. **Spec the job queue and webhook processing before writing any integration code.** A missed Razorpay webhook is a financial incident. BullMQ + Redis + a dead-letter alert is the minimum viable reliability pattern.
4. **Be honest in the README about self-host complexity.** Target the self-host path at technical users; build a scripted installer or clearly position Helm Cloud as the founder path.
5. **Define one SLO and one backup/restore test as Phase 1 exit criteria.** The SLO does not need to be ambitious — 99% availability over a 30-day window is fine for early stage. But it must exist, be measured, and be associated with a pager alert and a runbook before a real brand's orders flow through the system.
