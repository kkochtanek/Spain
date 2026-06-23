# Working with Kyle (kkochtanek)

## Communication preferences

### Guiding through unfamiliar websites / UIs — BE PRECISE
When walking the user through a website or tool they have never used (Cloudflare,
Anthropic Console, hosting dashboards, etc.), be highly descriptive and precise:

- Name the **exact label** of the button/link AND describe it: its color, icon,
  and where it sits on screen (e.g. "the blue **Deploy** button in the top-right
  corner of the editor, next to **Visit**").
- Give **one action per step**, in order. Don't bundle multiple clicks into one
  sentence.
- Spell out **exact text to type**, including capitalization, and call out when a
  field name must match exactly (e.g. variable names like `ANTHROPIC_API_KEY`).
- Distinguish clearly between similar-looking fields (e.g. "Name" vs "Value").
- Anticipate the next screen and tell the user what they should expect to see, so
  they can confirm they're in the right place before acting.
- After a risky/error-prone step, ask for a screenshot to verify before moving on.

This is a recurring point of feedback — do not regress to vague directions like
"click Settings" without describing where it is.
