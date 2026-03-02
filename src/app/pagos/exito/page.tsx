import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function ExitoPage() {
    return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
            <div className="glass-card max-w-lg w-full p-10 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>

                <h1 className="font-display text-3xl font-bold mb-4">
                    ¡Pago Exitoso!
                </h1>

                <p className="text-muted-foreground mb-8">
                    Tu suscripción Premium se ha activado correctamente. Ya puedes acceder a planificaciones sin límite y generar rúbricas avanzadas en PDF.
                </p>

                <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-lg"
                >
                    Ir al Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}
