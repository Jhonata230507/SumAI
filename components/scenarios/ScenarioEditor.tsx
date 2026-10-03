'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n/client'
import type { Scenario } from '@/types/scenario'

export interface ScenarioEditorProps {
  scenario: Scenario
}

/**
 * Edits the name and notes of a saved scenario. The figures themselves are
 * edited by reopening it in its calculator, so a result can never drift out of
 * step with the inputs that produced it.
 */
export function ScenarioEditor({ scenario }: ScenarioEditorProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [name, setName] = useState(scenario.name)
  const [notes, setNotes] = useState(scenario.notes ?? '')
  const [saving, setSaving] = useState(false)

  const dirty = name !== scenario.name || notes !== (scenario.notes ?? '')

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/scenarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scenario.id, name, notes }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm(t.scenarios.confirmDelete(scenario.name))) return
    await fetch(`/api/scenarios?id=${scenario.id}`, { method: 'DELETE' })
    router.push('/scenarios')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.scenarios.details}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="scenario-name">{t.common.name}</Label>
          <Input id="scenario-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="scenario-notes">{t.scenarios.notes}</Label>
          <textarea
            id="scenario-notes"
            value={notes}
            rows={4}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.scenarios.notesPlaceholder}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 border-t pt-4">
          <Button onClick={save} disabled={!dirty || saving || !name.trim()}>
            {saving ? t.common.saving : t.scenarios.saveChanges}
          </Button>
          <Button variant="ghost" onClick={remove} className="ml-auto text-destructive">
            <Trash2 className="h-4 w-4" />
            {t.common.delete}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
