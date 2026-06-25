import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GAME_RULES } from "./gameRulesData";

interface GameRulesModalProps {
  open: boolean;
  onClose: () => void;
  game: {
    en: string;
    bn: string;
    emoji: string;
    img?: string;
  } | null;
}

export default function GameRulesModal({ open, onClose, game }: GameRulesModalProps) {
  if (!game) return null;

  const rules = GAME_RULES[game.en];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-background border shadow-2xl flex flex-col"
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Hero Image Section */}
            <div className="relative h-44 sm:h-52 w-full flex-shrink-0 overflow-hidden">
              {game.img ? (
                <>
                  <img
                    src={game.img}
                    alt={game.en}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center">
                  <span className="text-7xl">{game.emoji}</span>
                </div>
              )}

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-3 right-3 text-white hover:bg-white/20 rounded-full z-20"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                  {game.emoji} {game.en}
                </h2>
                <p className="text-white/80 text-sm mt-0.5 drop-shadow">{game.bn}</p>
              </div>
            </div>

            {/* Rules Content */}
            <div
              className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>

              {rules ? (
                <>
                  {/* English Rules */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-orange-500" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Rules
                      </h3>
                    </div>
                    <ol className="space-y-2">
                      {rules.en.map((rule, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-3 items-start"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">{rule}</p>
                        </motion.li>
                      ))}
                    </ol>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Bengali Rules */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        নিয়মাবলী
                      </h3>
                    </div>
                    <ol className="space-y-2">
                      {rules.bn.map((rule, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          className="flex gap-3 items-start"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">{rule}</p>
                        </motion.li>
                      ))}
                    </ol>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-lg">📝 Rules coming soon!</p>
                  <p className="text-sm mt-1">নিয়মাবলী শীঘ্রই আসছে!</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
