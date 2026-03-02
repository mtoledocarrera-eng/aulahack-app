import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import type { FlipResponse, TeacherInput } from "@/lib/ai/schemas";

interface WizardFlipProps {
    flipResponse: FlipResponse;
    input: TeacherInput;
    setInput: (input: TeacherInput) => void;
    isLoading: boolean;
    onGenerate: () => void;
}

export function WizardFlip({ flipResponse, input, setInput, isLoading, onGenerate }: WizardFlipProps) {
    return (
        <div className="animate-fade-in space-y-6">
            <Card className="border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10 shadow-lg">
                <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageSquare className="w-6 h-6 text-brand-600" />
                        <h2 className="text-xl font-display font-bold text-foreground">¡Hola! Para que quede perfecto, necesito saber:</h2>
                    </div>
                    <div className="space-y-6">
                        {flipResponse.questions.map((q, idx) => (
                            <Card key={idx} className="bg-background shadow-sm border-border/60">
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-2 mb-4">
                                        <p className="font-medium">{q.question}</p>
                                        {q.inspiracion_creativa && (
                                            <div className="p-3 bg-brand-100/50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-lg text-sm italic border border-brand-200 dark:border-brand-800">
                                                💡 Inspiración: {q.inspiracion_creativa}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {q.options?.map((opt, i) => (
                                            <Button
                                                key={i}
                                                variant={input[q.field as keyof TeacherInput] === opt ? "default" : "outline"}
                                                onClick={() => setInput({ ...input, [q.field]: opt })}
                                                className="rounded-xl"
                                            >
                                                {opt}
                                            </Button>
                                        ))}
                                        <Input
                                            type="text"
                                            placeholder="Otra respuesta..."
                                            className="rounded-xl min-w-[200px] flex-1"
                                            onChange={(e) => setInput({ ...input, [q.field]: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <Button onClick={onGenerate} disabled={isLoading} size="lg" className="w-full py-6 text-base font-bold rounded-xl shadow-lg shadow-brand-600/20 mt-4">
                            {isLoading ? <Loader2 className="mr-2 w-6 h-6 animate-spin" /> : <>Generar Planificación <ArrowRight className="ml-2 w-5 h-5" /></>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
