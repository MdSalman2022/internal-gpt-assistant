/**
 * Guardrail Service
 * 
 * Detects PII and prompt injection patterns before sending to LLM.
 * Designed for minimal latency using regex-based detection.
 */

class GuardrailService {
    constructor() {
        // PII Detection Patterns
        this.piiPatterns = {
            email: {
                regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
                label: 'Email Address'
            },
            ssn: {
                regex: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
                label: 'SSN'
            },
            creditCard: {
                // Matches major card formats (Visa, MC, Amex, Discover)
                regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
                label: 'Credit Card'
            },
            creditCardSpaced: {
                // Credit cards with spaces or dashes
                regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
                label: 'Credit Card'
            },
            phone: {
                // International phone numbers
                regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
                label: 'Phone Number'
            },
            ipAddress: {
                regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
                label: 'IP Address'
            },
            passport: {
                // Generic passport: 6-9 alphanumeric, often starts with letter
                regex: /\b[A-Z]{1,2}\d{6,8}\b/gi,
                label: 'Passport Number'
            },
            bankAccount: {
                // Generic bank account: 8-17 digits
                regex: /\b\d{8,17}\b/g,
                label: 'Potential Bank Account'
            }
        };

        // Prompt Injection Patterns
        this.injectionPatterns = [
            { regex: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/gi, label: 'Instruction Override' },
            { regex: /disregard\s+(all\s+)?(previous|prior|above)/gi, label: 'Context Escape' },
            { regex: /you\s+are\s+now\s+(DAN|evil|unrestricted)/gi, label: 'Role Manipulation (DAN)' },
            { regex: /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/gi, label: 'Constraint Removal' },
            { regex: /pretend\s+you\s+(can|are\s+allowed\s+to)/gi, label: 'Pretend Bypass' },
            { regex: /repeat\s+(your\s+)?(system\s+)?prompt/gi, label: 'System Prompt Extraction' },
            { regex: /what\s+(is|are)\s+your\s+(system\s+)?(instructions?|prompt)/gi, label: 'System Prompt Extraction' },
            { regex: /reveal\s+(your\s+)?(hidden|secret|system)/gi, label: 'Hidden Info Extraction' },
            { regex: /\[SYSTEM\]/gi, label: 'System Tag Injection' },
            { regex: /<\|im_start\|>|<\|im_end\|>/gi, label: 'ChatML Injection' }
        ];

        // Exclusion patterns (to reduce false positives)
        // e.g., don't flag numbers that are clearly not sensitive
        this.exclusions = {
            bankAccount: [
                /\b\d{4}\b/g, // 4-digit numbers (years, codes)
                /\b(19|20)\d{2}\b/g // Years
            ]
        };
    }

    /**
     * Analyze text for PII and injection patterns.
     * @param {string} text - User message to analyze
     * @param {string} mode - 'redact' or 'block'
     * @returns {Object} { safe: boolean, findings: Array, redactedText: string, blocked: boolean }
     */
    analyze(text, mode = 'redact') {
        const findings = [];
        let redactedText = text;
        let hasInjection = false;

        // 1. Check for PII
        for (const [type, { regex, label }] of Object.entries(this.piiPatterns)) {
            // Skip overly broad patterns unless specific context
            if (type === 'bankAccount') continue; // Too many false positives, skip for now

            const matches = text.match(regex);
            if (matches) {
                // Deduplicate
                const uniqueMatches = [...new Set(matches)];
                uniqueMatches.forEach(match => {
                    findings.push({
                        type: 'pii',
                        category: type,
                        label,
                        value: match,
                        redactedValue: this._redact(match, type)
                    });
                    // Redact in text
                    redactedText = redactedText.split(match).join(this._redact(match, type));
                });
            }
        }

        // 2. Check for Prompt Injection
        for (const { regex, label } of this.injectionPatterns) {
            const matches = text.match(regex);
            if (matches) {
                hasInjection = true;
                matches.forEach(match => {
                    findings.push({
                        type: 'injection',
                        label,
                        value: match
                    });
                });
            }
        }

        // Determine safety
        const hasPII = findings.some(f => f.type === 'pii');

        // In 'block' mode, any finding is unsafe
        // In 'redact' mode, we redact PII and allow (but still flag injections as unsafe)
        let safe = true;
        let blocked = false;

        if (mode === 'block') {
            if (hasPII || hasInjection) {
                safe = false;
                blocked = true;
            }
        } else {
            // 'redact' mode: PII is redacted and allowed, but injection still blocks
            if (hasInjection) {
                safe = false;
                blocked = true;
            }
        }

        return {
            safe,
            blocked,
            findings,
            redactedText: safe || mode === 'redact' ? redactedText : text,
            hasPII,
            hasInjection
        };
    }

    /**
     * Create a redacted placeholder
     */
    _redact(value, type) {
        const labels = {
            email: '[EMAIL_REDACTED]',
            ssn: '[SSN_REDACTED]',
            creditCard: '[CARD_REDACTED]',
            creditCardSpaced: '[CARD_REDACTED]',
            phone: '[PHONE_REDACTED]',
            ipAddress: '[IP_REDACTED]',
            passport: '[PASSPORT_REDACTED]',
            bankAccount: '[ACCOUNT_REDACTED]'
        };
        return labels[type] || '[REDACTED]';
    }

    /**
     * Quick check if text likely contains sensitive data (for UI hints)
     */
    quickCheck(text) {
        // Fast check for common patterns
        const hasEmail = /@/.test(text);
        const hasNumbers = /\d{4,}/.test(text);
        return hasEmail || hasNumbers;
    }
}

const guardrailService = new GuardrailService();

export default guardrailService;
