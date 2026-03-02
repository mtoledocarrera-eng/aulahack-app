import { Sparkles } from "lucide-react";

export function WizardGenerating() {
    return (
        <div className="animate-fade-in py-20 text-center space-y-8">
            <div className="relative inline-block">
                <div className="w-24 h-24 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mx-auto" />
                <Sparkles className="w-10 h-10 text-brand-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold animate-pulse">Sustentando tu idea pedagógica...</h2>
                <p className="text-muted-foreground">Construyendo fases de proyecto, rol docente y matrices (DUA / Decreto 67)</p>
            </div>
        </div>
    );
}
