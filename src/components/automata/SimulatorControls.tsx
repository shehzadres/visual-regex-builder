import { useEffect, useMemo, useRef, useState } from "react";
import { SkipBack, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import type { NFA } from "../../engine/automata/nfaTypes";
import { simulateNFA, type SimulationResult } from "../../engine/automata/nfaSimulator";
import Button from "../../design-system/Button";
import { Input } from "../../design-system/Input";

interface SimulatorControlsProps {
    nfa: NFA;
    onStepChange: (step: SimulationResult["steps"][number] | null) => void;
}

const PLAYBACK_INTERVAL_MS = 700;

export default function SimulatorControls({
    nfa,
    onStepChange,
}: SimulatorControlsProps) {
    const [input, setInput] = useState("");
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const result = useMemo(() => simulateNFA(nfa, input), [nfa, input]);
    const steps = result.steps;
    const clampedIndex = Math.min(currentStepIndex, steps.length - 1);
    const currentStep = steps[clampedIndex] ?? null;

    useEffect(() => {
        onStepChange(currentStep);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep]);

    // Reset playback position whenever the input text or the underlying
    // NFA (i.e. the pattern) changes, so stale step indices never point
    // past the end of a shorter new trace.
    useEffect(() => {
        setCurrentStepIndex(0);
        setIsPlaying(false);
    }, [input, nfa]);

    useEffect(() => {
        if (!isPlaying) {
            if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = window.setInterval(() => {
            setCurrentStepIndex((prev) => {
                if (prev >= steps.length - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, PLAYBACK_INTERVAL_MS);

        return () => {
            if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, steps.length]);

    const handlePlayPause = () => {
        if (clampedIndex >= steps.length - 1) {
            setCurrentStepIndex(0);
        }
        setIsPlaying((prev) => !prev);
    };

    const handleStep = (delta: number) => {
        setIsPlaying(false);
        setCurrentStepIndex((prev) =>
            Math.max(0, Math.min(steps.length - 1, prev + delta))
        );
    };

    const handleReset = () => {
        setIsPlaying(false);
        setCurrentStepIndex(0);
    };

    const consumedSoFar = steps
        .slice(1, clampedIndex + 1)
        .map((s) => s.consumedChar ?? "")
        .join("");
    const remaining = input.slice(consumedSoFar.length);

    return (
        <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                Input string to simulate
                <Input
                    mono
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a string to trace through the NFA..."
                    spellCheck={false}
                />
            </label>

            {input.length > 0 && (
                <>
                    <div className="font-mono-tabular text-sm bg-surface-raised border border-border-default rounded-md px-2.5 py-2">
                        <span className="bg-warning-500/30 text-text-primary rounded px-0.5">
                            {consumedSoFar}
                        </span>
                        <span className="text-text-tertiary">{remaining}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            onClick={handleReset}
                            aria-label="Reset"
                            icon={<SkipBack className="w-3.5 h-3.5" />}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            onClick={() => handleStep(-1)}
                            disabled={clampedIndex === 0}
                            aria-label="Step back"
                            icon={<ChevronLeft className="w-3.5 h-3.5" />}
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handlePlayPause}
                            aria-label={isPlaying ? "Pause" : "Play"}
                            icon={
                                isPlaying ? (
                                    <Pause className="w-3.5 h-3.5" />
                                ) : (
                                    <Play className="w-3.5 h-3.5" />
                                )
                            }
                        >
                            {isPlaying ? "Pause" : "Play"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            onClick={() => handleStep(1)}
                            disabled={clampedIndex >= steps.length - 1}
                            aria-label="Step forward"
                            icon={<ChevronRight className="w-3.5 h-3.5" />}
                        />
                        <span className="text-xs font-mono-tabular text-text-tertiary ml-2">
                            Step {clampedIndex} of {steps.length - 1}
                        </span>
                    </div>

                    <div
                        className={`text-xs rounded-md px-2.5 py-1.5 border ${
                            result.isAccepted
                                ? "bg-success-bg text-success-300 border-success-600/30"
                                : "bg-surface-raised text-text-secondary border-border-default"
                        }`}
                    >
                        {currentStep && currentStep.activeStateIds.length === 0
                            ? "No live states remain — input rejected."
                            : result.isAccepted
                              ? "Input fully matches the pattern."
                              : `Live states: ${currentStep?.activeStateIds.join(", ") ?? "—"}`}
                    </div>
                </>
            )}
        </div>
    );
}
