import { Panel } from "@/components/atoms/Panel";
import { MutedText } from "@/components/atoms/MutedText";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { autosaveIntervals } from "@/hooks/main-application/useGamePreferences";

type SettingsPageProps = {
  autosaveIntervalSeconds: number;
  saveError?: string;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  onAutosaveIntervalChange: (seconds: number) => void;
};

export function SettingsPage({
  autosaveIntervalSeconds,
  saveError = "",
  saveStatus = "idle",
  onAutosaveIntervalChange
}: SettingsPageProps) {
  const saveMessage =
    saveError ||
    (saveStatus === "saving"
      ? "Saving your progress..."
      : saveStatus === "saved"
        ? "Progress saved."
        : "Autosave is enabled.");

  return (
    <section className="grid h-full min-h-0 content-start gap-4" data-testid="settings_section_page">
      <Panel
        as="section"
        className="h-full min-h-0 content-start gap-5"
        data-testid="settings_panel_preferences"
      >
        <SectionHeading eyebrow="Preferences" testId="settings_heading_preferences" title="Settings" />
        <SettingsGroup title="Save & progress" testId="settings_section_save">
          <label className="grid gap-2 text-sm font-bold" htmlFor="settings_autosave_interval">
            Autosave interval
            <select
              className="rounded-control border border-border bg-panel-muted px-3 py-2"
              data-testid="settings_select_autosave_interval"
              id="settings_autosave_interval"
              value={autosaveIntervalSeconds}
              onChange={(event) => onAutosaveIntervalChange(Number(event.target.value))}
            >
              {autosaveIntervals.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {formatInterval(seconds)}
                </option>
              ))}
            </select>
          </label>
          <MutedText data-testid="settings_p_autosave_status">{saveMessage}</MutedText>
        </SettingsGroup>
      </Panel>
    </section>
  );
}

function formatInterval(seconds: number) {
  if (seconds < 60) return `${seconds} seconds`;
  return `${seconds / 60} minute${seconds === 60 ? "" : "s"}`;
}

function SettingsGroup({
  children,
  testId,
  title
}: {
  children: React.ReactNode;
  testId: string;
  title: string;
}) {
  return (
    <section
      className="grid content-start gap-3 rounded-control border border-border p-4"
      data-testid={testId}
    >
      <h3 className="m-0 text-sm font-black uppercase text-primary-strong">{title}</h3>
      {children}
    </section>
  );
}
