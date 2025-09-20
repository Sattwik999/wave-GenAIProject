
export function demoReply(userText: string): string {
  const t = userText.toLowerCase()
  let action = 'Try a 4-4-6 breath: inhale 4, hold 4, exhale 6.'
  if (/(walk|outside|fresh air|stuck)/.test(t)) action = 'A 3–5 min walk and a bit of water can reset your mind.'
  if (/(friend|alone|talk|call)/.test(t)) action = 'Maybe message someone you trust and share one small thing you feel.'
  if (/(exam|study|work|deadline)/.test(t)) action = 'Break it into a tiny next step—just 10 minutes. Then reassess.'
  if (/(sleep|tired|exhaust)/.test(t)) action = 'Close your eyes, breathe gently, and loosen your jaw/shoulders for a minute.'
  const start = 'I hear you—thanks for sharing.'
  const follow = 'What would help a little right now?'
  return `${start} ${action} ${follow}`.slice(0, 120)
}
