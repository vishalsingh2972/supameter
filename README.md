# SupaMeter AI 🗄️⚡

SupaMeter AI is an open-source performance diagnostics dashboard and gateway designed for modern backend stacks. It intercepts, parses, and visualizes complex, cryptic PostgreSQL `EXPLAIN ANALYZE` execution logs, transforming raw data into clear infrastructure optimization insights under 40ms using structural AI modeling pipelines.

Built specifically to resolve production database CPU spikes, query latency regressions, and costly API loop drops.

---

## 🏗️ Architecture & Tech Stack

SupaMeter AI utilizes a type-safe, zero-overhead runtime architecture:

*   **Monorepo Workspace:** Managed via **npm workspaces & Turborepo** for clean, scalable, multi-app package orchestration.
*   **Frontend Engine:** **Next.js 14 (App Router)** built natively with **TypeScript** and **Tailwind CSS** for a low-latency administrative interface.
*   **Database Infrastructure:** **PostgreSQL (Supabase/Neon)** containing metadata tables hardened with custom **Row Level Security (RLS)** security matrices.
*   **AI Engine:** Engineered using the production-ready **Google Gen AI SDK (`@google/genai`)** driving `gemini-2.5-flash` with strict programmatic JSON schema constraints.

---

## ⚡ The Solution: Before vs. After

### Without SupaMeter AI
1. A production query slows to **4500ms**, stalling asynchronous network processes.
2. Running `EXPLAIN ANALYZE` spits out a confusing, **800-line wall of text** detailing `Parallel Bitmap Heap Scans`, `Hash Conds`, and cost variables.
3. Developers waste valuable hours guessing indexes while system availability degrades.

### With SupaMeter AI
1. The raw, unreadable execution block is passed directly to the SupaMeter gateway pipeline.
2. The system maps the node operations and evaluates processing hot-spots.
3. **Instant Mitigation Banner:** Identifies exact relational bottlenecks (e.g., missing index keys or unexpected sequential table scans) and outputs a precise, single-line SQL remediation command ready for execution.

---

## 📦 Directory Overview

```text
supameter/
├── package.json               # Core Monorepo Setup (npm workspaces)
├── package-lock.json
├── apps/
│   ├── web/                   # Next.js Full-Stack Web Application
│   │   ├── package.json
│   │   └── app/
│   │       ├── layout.tsx     # Global Shell Framework
│   │       ├── page.tsx       # Interactive Metrics Dashboard UI
│   │       └── api/
│   │           └── analyze/
│   │               └── route.ts  # Diagnostic AI Pipeline Route
