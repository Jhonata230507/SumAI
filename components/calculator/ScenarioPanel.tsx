'use client'

import { useState } from 'react'
import { Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils/dates'
import { useI18n } from '@/lib/i18n/client'
import type { Scenario } from '@/types/scenario'

export interface ScenarioPanelProps {
  scenarios: Scenario[]
  signedIn: boolean
  onSave?: (name: string) => Promise<void> | void
  onLoad?: (scenario: Scenario) => void
  onCompare?: (scenario: Scenario) => void
}

/** Saves the current calculation and lists earlier ones for this calculator. */
export function ScenarioPanel({
  scenarios,
  signedIn,
  onSave,
  onLoad,
  onCompare,
}: ScenarioPanelProps) {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave?.(name.trim())
      setName('')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!signedIn) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-medium">{t.scenarioPanel.saveTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.scenarioPanel.signInPrompt}</p>
          <Button size="sm" className="mt-3">
            {t.common.signIn}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{t.scenarioPanel.yourScenarios}</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {t.scenarioPanel.saveCurrent}
        </Button>
      </CardHeader>

      <CardContent>
        {scenarios.length === 0 ? (
          <EmptyState
            title={t.scenarioPanel.emptyTitle}
            description={t.scenarioPanel.emptyDescription}
            icon={<Save className="h-8 w-8" />}
          />
        ) : (
          <ul className="space-y-2">
            {scenarios.map((scenario) => (
              <li key={scenario.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{scenario.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.scenarioPanel.saved(formatDate(scenario.updatedAt, locale))}
                  </p>
                </div>

                <Button size="sm" variant="ghost" onClick={() => onLoad?.(scenario)}>
                  {t.scenarioPanel.load}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onCompare?.(scenario)}>
                  {t.scenarioPanel.compare}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t.scenarioPanel.dialogTitle}
        description={t.scenarioPanel.dialogDescription}
        closeLabel={t.common.close}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="scenario-name">{t.common.name}</Label>
            <Input
              id="scenario-name"
              value={name}
              autoFocus
              placeholder={t.scenarioPanel.namePlaceholder}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? t.common.saving : t.common.save}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  )
}
