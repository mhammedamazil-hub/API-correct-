import { providers } from '../providers'
import type { ProviderId } from '../types'

interface Props {
  value: ProviderId
  onChange: (id: ProviderId) => void
  disabled?: boolean
}

export function ProviderGrid({ value, onChange, disabled }: Props) {
  return (
    <div>
      <h2 className="section-title">Provider</h2>
      <div className="providers">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className={`provider${value === provider.id ? ' is-selected' : ''}`}
            disabled={disabled}
            onClick={() => onChange(provider.id)}
          >
            <b>{provider.name}</b>
            <small>{provider.keyHint}</small>
          </button>
        ))}
      </div>
    </div>
  )
}
