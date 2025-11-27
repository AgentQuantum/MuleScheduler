/**
 * Tests for API service configuration.
 */
import api from '../services/api'

describe('API Service', () => {
  it('has baseURL configured', () => {
    expect(api.defaults.baseURL).toBeDefined()
  })

  it('has headers object', () => {
    expect(api.defaults.headers).toBeDefined()
    expect(api.defaults.headers.common).toBeDefined()
  })

  it('exports axios instance with methods', () => {
    expect(api.get).toBeDefined()
    expect(api.post).toBeDefined()
    expect(api.put).toBeDefined()
    expect(api.delete).toBeDefined()
  })
})

