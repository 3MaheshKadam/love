// ====================================================================
// Basic Profanity Filter — LovePlay Phase 1
// Blocks obviously explicit/inappropriate words.
// For Phase 2, consider a library like "bad-words" or AI moderation.
// ====================================================================

// Common explicit/inappropriate words (lowercase)
// This is intentionally a compact list targeting the worst offenders.
// Not exhaustive — enough for Phase 1 private content.
const BLOCKED_WORDS = [
    // Sexual/explicit
    "sex", "sexy", "sexual", "nude", "naked", "porn", "dick", "cock",
    "pussy", "boob", "tits", "ass", "anal", "oral", "blowjob", "handjob",
    "orgasm", "cum", "horny", "boner", "erection", "nipple", "vagina",
    "penis", "masturbat", "fetish", "bdsm", "kink",
    // Violent/abusive
    "kill", "murder", "rape", "abuse", "molest", "stalk",
    "suicide", "self-harm", "cutting",
    // Hate speech
    "nigger", "nigga", "faggot", "retard", "slut", "whore",
    // Drugs
    "cocaine", "heroin", "meth",
];

// HTML/script injection patterns
const INJECTION_PATTERNS = [
    /<script/i,
    /<\/script/i,
    /javascript:/i,
    /on\w+\s*=/i,     // onclick=, onerror=, etc.
    /<iframe/i,
    /<img[^>]+onerror/i,
    /eval\s*\(/i,
    /document\./i,
];

export interface FilterResult {
    clean: boolean;
    reason?: string;
}

export function filterContent(text: string): FilterResult {
    if (!text || typeof text !== "string") {
        return { clean: false, reason: "Text is required" };
    }

    const trimmed = text.trim();

    // Length check
    if (trimmed.length < 5) {
        return { clean: false, reason: "Card text must be at least 5 characters" };
    }

    if (trimmed.length > 200) {
        return { clean: false, reason: "Card text must be 200 characters or less" };
    }

    // HTML/injection check
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(trimmed)) {
            return { clean: false, reason: "Invalid characters detected" };
        }
    }

    // Profanity check (word boundary matching)
    // Strip punctuation to catch bypasses like "s.e.x" or "f@ck"
    const lower = trimmed.toLowerCase();
    const noPunctuation = lower.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()@"']/g, "");

    for (const word of BLOCKED_WORDS) {
        // Match as substring against the punctuation-stripped string
        if (noPunctuation.includes(word)) {
            return { clean: false, reason: "Content contains inappropriate language" };
        }
    }

    return { clean: true };
}
