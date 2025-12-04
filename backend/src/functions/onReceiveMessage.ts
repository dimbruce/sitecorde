import * as functions from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Note: Signature validation disabled per request. We keep only parsing and writing.

// Frontend TaskStatus enum string values for consistency
const TaskStatus = {
  Completed: "Completed",
  InProgress: "In Progress",
  Delayed: "Delayed",
  NotStarted: "Not Started",
  JobSiteReady: "Job Site Ready",
} as const;

type ParsedMessage = {
  status: keyof typeof TaskStatus | null; // keys of TaskStatus map
  task: string | null;
  where: string | null; // address
  progressPct: number | null; // extracted percentage if present
};

function normalizeText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

// Parse messages like: "finished with plumbing at 92 turtleback road"
function parseMessage(body: string): ParsedMessage {
  const normalized = normalizeText(body);
  const lowered = normalized.toLowerCase();

  const statusWords = [
    "finished",
    "complete",
    "completed",
    "done",
    "started",
    "begin",
    "began",
    "paused",
    "resumed",
    "blocked",
    "delayed",
    "in-progress",
  ];

  const statusAlt = statusWords
    .map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"))
    .join("|");
  const re = new RegExp(
    `^(?<status>${statusAlt})(?:\\s+with)?\\s+(?<task>.+?)\\s+(?:at|@)\\s+(?<where>.+)$`,
    "i"
  );

  const m = re.exec(normalized);
  let statusKey: ParsedMessage["status"] = null;
  if (m && m.groups) {
      const s = m.groups.status.toLowerCase();
    // Map to TaskStatus keys
    const map: Record<string, ParsedMessage["status"]> = {
      finished: "Completed",
      complete: "Completed",
      completed: "Completed",
      done: "Completed",
      started: "InProgress",
      begin: "InProgress",
      began: "InProgress",
      paused: "Delayed",
      delayed: "Delayed",
      blocked: "Delayed",
      resumed: "InProgress",
      "in-progress": "InProgress",
    };
    statusKey = map[s] ?? null;
    // Try to find a percentage anywhere in the message
    const pctMatch = /(?<pct>\d{1,3})\s*%/.exec(normalized);
    const pctVal = pctMatch?.groups?.pct ? Math.min(100, Math.max(0, parseInt(pctMatch.groups.pct, 10))) : null;
    return {
      status: statusKey,
      task: m.groups.task.trim(),
      where: m.groups.where.trim(),
      progressPct: pctVal,
    };
  }

  // Alternate pattern: address-first messages like
  // "92 turtleback plumbing is 100% done" or "123 Main St electrical completed"
  // Capture: where (leading address), task (middle), optional "is 100%",
  // and a terminal status word.
  const re2 = new RegExp(
    `^(?<where>\\d+\\s+[^\n]+?)\\s+(?<task>.+?)\\s+(?:is\\s+(?<pct>\\d{1,3})%?\\s+)?(?<status>${statusAlt})$`,
    "i"
  );
  const m2 = re2.exec(normalized);
  if (m2 && m2.groups) {
    const s2 = m2.groups.status.toLowerCase();
    const map2: Record<string, ParsedMessage["status"]> = {
      finished: "Completed",
      complete: "Completed",
      completed: "Completed",
      done: "Completed",
      started: "InProgress",
      begin: "InProgress",
      began: "InProgress",
      paused: "Delayed",
      delayed: "Delayed",
      blocked: "Delayed",
      resumed: "InProgress",
      "in-progress": "InProgress",
    };
    const status2 = map2[s2] ?? null;
    const pctVal2 = m2.groups.pct ? Math.min(100, Math.max(0, parseInt(m2.groups.pct, 10))) : null;
    return {
      status: status2,
      task: m2.groups.task.trim(),
      where: m2.groups.where.trim(),
      progressPct: pctVal2,
    };
  }

  // Fallback: try to detect just status
  const found = statusWords.find((w) => lowered.includes(w));
  if (found) {
    const map: Record<string, ParsedMessage["status"]> = {
      finished: "Completed",
      complete: "Completed",
      completed: "Completed",
      done: "Completed",
      started: "InProgress",
      begin: "InProgress",
      began: "InProgress",
      paused: "Delayed",
      delayed: "Delayed",
      blocked: "Delayed",
      resumed: "InProgress",
      "in-progress": "InProgress",
    };
    const pctMatch = /(?<pct>\d{1,3})\s*%/.exec(normalized);
    const pctVal = pctMatch?.groups?.pct ? Math.min(100, Math.max(0, parseInt(pctMatch.groups.pct, 10))) : null;
    return { status: map[found] ?? null, task: null, where: null, progressPct: pctVal };
  }
  return { status: null, task: null, where: null, progressPct: null };
}

// Try to find a project by address. We do a simple contains/equals match, case-insensitive.
async function findProjectIdByAddress(address: string | null): Promise<string | null> {
  if (!address) return null;
  const addrNorm = normalizeText(address).toLowerCase();
  const db = getFirestore();
  const snap = await db.collection("projects").get();
  for (const doc of snap.docs) {
    const data = doc.data() as { address?: string };
    if (!data?.address) continue;
    const projectAddr = normalizeText(String(data.address)).toLowerCase();
    if (projectAddr === addrNorm || projectAddr.includes(addrNorm) || addrNorm.includes(projectAddr)) {
      return doc.id;
    }
  }
  return null;
}

// Fallback helper: if we couldn't parse a clean address, try to see if the entire message
// contains a project's address (case-insensitive, normalized). This lets messages like
// "Freedom ave plumbing is 50% done" match a project with address "123 Freedom Ave".
async function findProjectIdByAddressInMessage(message: string): Promise<string | null> {
  const msgNorm = normalizeText(message).toLowerCase();
  if (!msgNorm) return null;
  const db = getFirestore();
  const snap = await db.collection("projects").get();
  for (const doc of snap.docs) {
    const data = doc.data() as { address?: string };
    if (!data?.address) continue;
    const projectAddr = normalizeText(String(data.address)).toLowerCase();
    if (!projectAddr) continue;
    // Consider either direction of containment to be a match
    if (msgNorm.includes(projectAddr) || projectAddr.includes(msgNorm)) {
      return doc.id;
    }
    // Also try a loose token match: require at least two address tokens present in message
    const tokens = projectAddr.split(/\s+/).filter(Boolean);
    const present = tokens.filter(t => msgNorm.includes(t));
    if (present.length >= Math.min(2, tokens.length)) {
      return doc.id;
    }
  }
  return null;
}

// Normalize a phone number to digits-only for comparison
function normalizePhone(num: string): string {
  return String(num || "").replace(/\D+/g, "");
}

// Try to find a Trade by phone number (match by last digits to tolerate country codes)
async function findTradeIdByPhone(phone: string): Promise<string | null> {
  const fromDigits = normalizePhone(phone);
  if (!fromDigits) return null;
  const db = getFirestore();
  const snap = await db.collection("trades").get();
  let bestMatch: { id: string; len: number } | null = null;
  for (const d of snap.docs) {
    const data = d.data() as { phone?: string };
    if (!data?.phone) continue;
    const tradeDigits = normalizePhone(data.phone);
    if (!tradeDigits) continue;
    // Compare by suffix so +1 / country codes don't break match
    if (fromDigits.endsWith(tradeDigits)) {
      const len = tradeDigits.length;
      if (!bestMatch || len > bestMatch.len) {
        bestMatch = { id: d.id, len };
      }
    }
  }
  return bestMatch?.id ?? null;
}

export const onReceiveMessage = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const params = req.body || {};

      const from = String(params.From || "");
      const body = String(params.Body || "");

      const parsed = parseMessage(body);

      // Resolve trade by sender phone number early for potential fallback
      const resolvedTradeId = await findTradeIdByPhone(from);

      // Find project by address first
      let projectId = await findProjectIdByAddress(parsed.where);
      let fallbackTried: string | null = null;

      // If structured address parsing failed, try to match any project whose address appears in the full message
      if (!projectId) {
        const byMsg = await findProjectIdByAddressInMessage(body);
        if (byMsg) {
          projectId = byMsg;
          fallbackTried = "by_message_contains_address";
        }
      }

      // Fallback: if no project matched by address, try to infer by trade assignment
      if (!projectId && resolvedTradeId) {
        try {
          const db = getFirestore();
          const cgSnap = await db
            .collectionGroup("tasks")
            .where("tradeId", "==", resolvedTradeId)
            .limit(1)
            .get();
          if (!cgSnap.empty) {
            const tdoc = cgSnap.docs[0];
            const projectRef = tdoc.ref.parent.parent; // tasks -> project
            projectId = projectRef?.id ?? null;
            if (!fallbackTried) fallbackTried = "by_trade_tasks";
          }
        } catch (e) {
          // If collection group query fails (e.g., missing index), ignore and proceed to inbound logging
          console.warn("Fallback by tradeId failed", e);
        }
      }

      const db = getFirestore();

      // If we found a project (by address or fallback), we will try to update an existing task
      if (projectId) {
        const today = new Date();
        const ymd = today.toISOString().slice(0, 10); // YYYY-MM-DD

        const taskCol = db.collection("projects").doc(projectId).collection("tasks");

        // Determine effective status and progress based on parsed percentage if present
        let effectiveStatus: string;
        let progressUpdate: number | null = null;
        if (parsed.progressPct !== null && parsed.progressPct !== undefined) {
          const pct = Math.max(0, Math.min(100, parsed.progressPct));
          progressUpdate = pct;
          if (pct >= 100) effectiveStatus = TaskStatus.Completed;
          else if (pct <= 0) effectiveStatus = TaskStatus.NotStarted;
          else effectiveStatus = TaskStatus.InProgress;
        } else {
          effectiveStatus = parsed.status ? TaskStatus[parsed.status] : TaskStatus.InProgress;
        }

        // Try to find an existing task for this trade and project that matches by name or trade name
        let updated = false;
        if (resolvedTradeId) {
          try {
            const tradeDoc = await db.collection("trades").doc(resolvedTradeId).get();
            const tradeName = (tradeDoc.exists ? (tradeDoc.data()?.name as string) : "") || "";

            const existingSnap = await taskCol.where("tradeId", "==", resolvedTradeId).get();
            const candidate = (parsed.task || "").toLowerCase();
            const bodyLower = body.toLowerCase();

            // Prefer matching by task.name similarity
            let matchedTaskDoc = existingSnap.docs.find((d) => {
              const t = d.data() as { name?: string };
              const name = (t.name || "").toLowerCase();
              return !!name && (!!candidate && (name.includes(candidate) || candidate.includes(name)));
            });

            // If not matched by name, and SMS mentions the trade name, but only one task exists for this trade, use it
            if (!matchedTaskDoc && tradeName && bodyLower.includes(tradeName.toLowerCase()) && existingSnap.size === 1) {
              matchedTaskDoc = existingSnap.docs[0];
            }

            if (matchedTaskDoc) {
              const updates: {
                status: string;
                _updatedFromSmsAt: ReturnType<typeof FieldValue.serverTimestamp>;
                progress?: number;
              } = {
                status: effectiveStatus,
                _updatedFromSmsAt: FieldValue.serverTimestamp(),
              };
              if (progressUpdate !== null) updates.progress = progressUpdate;
              await matchedTaskDoc.ref.update(updates);
              updated = true;
            }
          } catch (e) {
            console.warn("Task lookup/update failed", e);
          }
        }

        // If we couldn't update an existing task, create a new one per requirements
        if (!updated) {
          await taskCol.add({
            projectId,
            tradeId: resolvedTradeId ?? "unassigned",
            name: parsed.task || undefined,
            status: effectiveStatus,
            dependency: null,
            notes: parsed.task ? `${parsed.task}${parsed.where ? ` @ ${parsed.where}` : ""}` : body,
            startDate: ymd,
            endDate: ymd,
            progress: progressUpdate !== null ? progressUpdate : (parsed.status === "Completed" ? 100 : 0),
            _source: "sms", // non-breaking additional metadata
            _from: from,
            _createdAt: FieldValue.serverTimestamp(),
          });
        }
      } else {
        // If no project matched, still record the inbound message for later triage
        await db.collection("inboundMessages").add({
          from,
          body,
          parsed,
          createdAt: FieldValue.serverTimestamp(),
          reason: "project_not_found",
          attemptedTradeId: resolvedTradeId ?? null,
          fallbackTried: fallbackTried,
        });
      }

      // No reply for now: just acknowledge receipt with 200 OK and empty body
      res.status(200).end();
    } catch (err) {
      console.error("onReceiveMessage error", err);
      res.status(500).send("Server error");
    }
  }
);
