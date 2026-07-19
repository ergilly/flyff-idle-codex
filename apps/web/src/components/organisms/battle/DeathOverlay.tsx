import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";

export function DeathOverlay({
  error,
  isRespawning,
  onRespawn,
  townName
}: {
  error?: string;
  isRespawning: boolean;
  onRespawn: () => void;
  townName: string;
}) {
  return (
    <div
      aria-label="You died"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/72 p-4"
      data-testid="battle_dialog_death"
      role="dialog"
    >
      <div className="grid w-full max-w-[360px] gap-4 rounded-card border-2 border-[rgba(200,44,44,0.68)] bg-[linear-gradient(180deg,rgba(40,20,20,0.98),rgba(5,6,5,0.98))] p-5 text-center shadow-[0_18px_38px_rgba(0,0,0,0.52)]">
        <h2 className="text-2xl font-black uppercase tracking-wide text-[#ff7b58]">You died</h2>
        <p className="text-sm font-bold text-text-muted">Respawn at {townName} to continue.</p>
        {error ? <ErrorMessage message={error} /> : null}
        <Button disabled={isRespawning} onClick={onRespawn} type="button">
          {isRespawning ? "Respawning..." : "Respawn at town"}
        </Button>
      </div>
    </div>
  );
}
