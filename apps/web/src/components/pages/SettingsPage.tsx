type SettingsPageProps = {
  autosaveIntervalSeconds: number;
  onAutosaveIntervalChange: (seconds: number) => void;
};

export function SettingsPage({ autosaveIntervalSeconds, onAutosaveIntervalChange }: SettingsPageProps) {
  return (
    <section className="grid max-w-[720px] content-start gap-4" data-testid="settings_section_page">
      <div className="grid gap-2 rounded-card border-[3px] border-border bg-panel p-5">
        <h2 className="text-lg font-black uppercase">Settings</h2>
        <label className="grid max-w-[280px] gap-2 text-sm font-bold" htmlFor="settings_autosave_interval">
          Autosave interval
          <select
            className="rounded-control border border-border bg-panel-muted px-3 py-2"
            data-testid="settings_select_autosave_interval"
            id="settings_autosave_interval"
            value={autosaveIntervalSeconds}
            onChange={(event) => onAutosaveIntervalChange(Number(event.target.value))}
          >
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={120}>2 minutes</option>
            <option value={300}>5 minutes</option>
            <option value={600}>10 minutes</option>
            <option value={1800}>30 minutes</option>
          </select>
        </label>
      </div>
    </section>
  );
}
