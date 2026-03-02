"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { saveUserFeedback } from "@/lib/firebase/analytics";

interface FeedbackDialogProps {
    planId: string;
    userId: string | null;
}

export function FeedbackDialog({ planId, userId }: FeedbackDialogProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    async function handleSubmit() {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await saveUserFeedback({
                planId,
                userId,
                rating,
                comment,
                userAgent: window.navigator.userAgent,
            });
            setIsSuccess(true);
            setTimeout(() => {
                setOpen(false);
                setIsSuccess(false);
                setRating(0);
                setComment("");
            }, 2000);
        } catch (error) {
            console.error("Failed to submit feedback", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl font-medium flex items-center gap-2 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/40">
                    <MessageSquare className="w-4 h-4" />
                    Dar Feedback
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>¿Qué te pareció esta planificación?</DialogTitle>
                    <DialogDescription>
                        Tu opinión nos ayuda a afinar el motor de IA para generar mejores clases.
                    </DialogDescription>
                </DialogHeader>

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
                        <CheckCircle2 className="w-12 h-12 text-dua-success mb-3" />
                        <h3 className="text-xl font-bold">¡Gracias por tu opinión!</h3>
                        <p className="text-muted-foreground text-sm mt-2">Hemos registrado tu feedback correctamente.</p>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoverRating || rating)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-muted-foreground/30"
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>

                        <Textarea
                            placeholder="¿Qué faltó? ¿Hubo algo extraño? (Opcional)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] resize-none focus:ring-brand-500 rounded-xl"
                        />

                        <Button
                            onClick={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                            className="w-full text-base font-bold text-white rounded-xl shadow-md transition-all h-12 bg-brand-600 hover:bg-brand-700 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            Enviar Feedback
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
