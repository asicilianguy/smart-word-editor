import it from "./messages/it.json";

type Messages = typeof it;

declare global {
  // Usa il tipo delle traduzioni italiane come riferimento
  // Questo abilita l'autocompletamento per tutte le chiavi di traduzione
  interface IntlMessages extends Messages {}
}
