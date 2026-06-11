import type { AuthUser, UserRole } from '../context/AuthContext'
import type { AuditEntry } from '../context/AuditContext'

const API_BASE = 'http://localhost:8000'

export interface TokenResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export interface OperatorRecord {
  id: number
  username: string
  displayName: string
  role: UserRole
  status: 'active' | 'revoked'
}

class AuthApi {
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const token = localStorage.getItem('atb_auth_token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  async login(username: string, password: string): Promise<TokenResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    return {
      access_token: data.access_token,
      token_type: data.token_type,
      user: {
        username: data.user.username,
        role: data.user.role,
        displayName: data.user.display_name,
      },
    }
  }

  async getMe(): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch profile')
    const data = await res.json()
    return {
      username: data.username,
      role: data.role,
      displayName: data.display_name,
    }
  }

  async getOperators(): Promise<OperatorRecord[]> {
    const res = await fetch(`${API_BASE}/admin/operators`, {
      headers: this.getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch operators')
    const data = await res.json()
    return data.map((u: any) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      role: u.role,
      status: u.is_active ? 'active' : 'revoked',
    }))
  }

  async toggleOperatorStatus(username: string): Promise<OperatorRecord> {
    const res = await fetch(`${API_BASE}/admin/operators/${username}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to toggle operator status')
    const data = await res.json()
    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      role: data.role,
      status: data.is_active ? 'active' : 'revoked',
    }
  }

  async getAuditLogs(): Promise<AuditEntry[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: this.getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch audit logs')
    const data = await res.json()
    return data.map((l: any) => ({
      id: l.id,
      operator: l.operator_username,
      actionType: l.action_type,
      description: l.description,
      timestamp: new Date(l.created_at),
    }))
  }

  async addAuditLog(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        operator_username: entry.operator,
        action_type: entry.actionType,
        description: entry.description,
      }),
    })
    if (!res.ok) throw new Error('Failed to add audit log')
    const data = await res.json()
    return {
      id: data.id,
      operator: data.operator_username,
      actionType: data.action_type,
      description: data.description,
      timestamp: new Date(data.created_at),
    }
  }

  async clearAuditLogs(): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to clear audit logs')
  }
}

export const authApi = new AuthApi()
