import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function FracasoPage() {
    return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
            <div className="glass-card max-w-lg w-full p-10 text-center border-red-500/20 shadow-red-500/10">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>

                <h1 className="font-display text-3xl font-bold mb-4">
                    Pago Rechazado
                </h1>

                <p className="text-muted-foreground mb-8">
                    Lo sentimos, tu pago fue rechazado por la tarjeta procesadora o se canceló el proceso. No se ha realizado ningún cargo en tu cuenta.
                </p>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/precios"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-lg"
                    >
                        <RefreshCw className="w-5 h-5" /> Intentar Nuevamente
                    </Link>
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground font-bold rounded-2xl transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" /> Volver al Inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
