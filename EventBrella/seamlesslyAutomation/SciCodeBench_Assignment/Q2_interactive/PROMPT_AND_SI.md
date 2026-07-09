# Q2: Interactive Question and Rubrics (No Colab / Use Gemini App)

This folder contains an **interactive question**, **System Instructions (SI)**, **CUJ rubric (JSON)**, and **submission template**. You can complete the task in the **Gemini app** (or any chat UI) and then fill the spreadsheet and save the HTML.

---

## 1. Interactive Question (Prompt)

**Domain:** Software engineering / API design

**Prompt to use in the Gemini app:**

```
You are helping me design and implement a small public API for a "user preferences" service.

Requirements (initial):
- Store and retrieve preferences by user ID and preference key.
- Support at least: get(key), set(key, value), delete(key), list_keys().
- We will add authentication and rate limits later; for now assume a single-tenant backend.

Before writing any code or finalizing the API shape:
1. Ask me at least one clarifying question about scope, constraints, or expected behavior (e.g. key format, value types, persistence, or error handling).
2. After I answer, propose a minimal API (function signatures or REST endpoints) and confirm with me.
3. Then provide a short implementation sketch or pseudocode for the core operations, and mention one edge case or failure mode you considered.

Proceed step by step; do not output the full implementation until we have agreed on the design.
```

**Why this benefits from interactivity:**  
A single-shot answer would guess key format, value types, and persistence. An interactive flow allows the model to **ask clarifying questions**, **confirm the API shape**, and **iterate on edge cases** with the user—leading to a better and more verifiable design. The rubric will check for evidence of that interaction (questions asked, confirmation step, edge case discussed).

---

## 2. System Instructions (SI)

**Paste this as System Instructions (or “Instruction” / “Custom instructions”) in the Gemini app so the model responds in an interactive, step-by-step way:**

```
You are an expert software engineer helping the user design and implement a small API. Follow these rules:

1. **Interact first, implement later.** Do not write full code or finalize an API until you have:
   - Asked at least one specific clarifying question (e.g. about key format, value types, persistence, or errors).
   - Received an answer (or the user has said "no preference" / "your choice").
   - Proposed a minimal API (signatures or endpoints) and explicitly asked for confirmation (e.g. "Does this match what you have in mind?").

2. **One step per turn when possible.** Prefer to:
   - First turn: ask 1–2 clarifying questions.
   - After user reply: propose API and ask for confirmation.
   - After confirmation: give implementation sketch and mention at least one edge case or failure mode.

3. **Be concise.** Use short paragraphs and bullet points. If the user asks for code only after the design is agreed, then provide code.

4. **Do not assume.** If the prompt does not specify key format (e.g. string vs namespaced), value types (e.g. JSON vs string), or persistence (in-memory vs DB), ask before locking the design.
```

---

## 3. How to Use (Without Colab)

1. **Gemini app:** Open the Gemini app (or a chat interface with Gemini).
2. **Set SI:** Where the app allows “System instructions” or “Instructions,” paste the **SI** from Section 2.
3. **Start the conversation:** Send the **Prompt** from Section 1.
4. **Interact:** Answer the model’s questions, confirm the API, then ask for the implementation sketch.
5. **Save:**
   - Export or copy the full conversation (Prompt + your replies + Gemini response) into the **HTML file** (see `submission_template.html`).
   - Fill the **spreadsheet** (see `submission_template.csv`) with: Prompt, DI, Gemini Response, Json_rubrics, and the URL of the saved HTML (e.g. Google Drive link).

The **CUJ rubric** in `cuj_rubric.json` is used to score the **Gemini response** (and optionally the full thread). The rubric is designed so that when applied to a typical Gemini answer, **at least 30% of criteria have human_rating = false** (headroom).
