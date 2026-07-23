import { describe, expect, it } from 'vitest'
import { createSessionManager, passwordMatches } from '../src/session.js'

describe('session security', () => {
  it('accepts valid sessions and rejects tampering', () => {
    const sessions = createSessionManager('a-secure-session-secret-with-32-characters')
    const token = sessions.create()
    expect(sessions.verify(token)).toBe(true)
    expect(sessions.verify(`${token}x`)).toBe(false)
    expect(sessions.verify('invalid')).toBe(false)
  })

  it('rejects expired sessions', () => {
    const sessions = createSessionManager('a-secure-session-secret-with-32-characters', -1)
    expect(sessions.verify(sessions.create())).toBe(false)
  })

  it('compares administrator passwords safely', () => {
    expect(passwordMatches('correct-password', 'correct-password')).toBe(true)
    expect(passwordMatches('wrong', 'correct-password')).toBe(false)
  })
})
