------------------------------ MODULE money ------------------------------
(***************************************************************************)
(* TLA+ model zachování peněz pro race-condition audit (15. styl), M-TLA. *)
(* Plán: docs/race-condition-plan/00-cross-cutting.md §D.                  *)
(*                                                                         *)
(* Dokazuje: pokud je převod / odečet JEDEN ATOMICKÝ krok (= naše opravy  *)
(* `appendTransactionIfSufficient` s `$gte` a `withTransaction`), pak NEEXISTUJE *)
(* prokládání, které poruší zachování peněz nebo způsobí přečerpání —     *)
(* TLC ověří VŠECHNY dosažitelné stavy.                                    *)
(*                                                                         *)
(* Kontrast (RC-E1/E3 bug): neatomický „read -> compute -> write" by byl   *)
(* MODELOVÁN jako 2 kroky s mezistavem; concurrent krok by četl zastaralý  *)
(* zůstatek a TLC by našel protipříklad na NoOverdraft / MoneyConserved.   *)
(*                                                                         *)
(* Spuštění: TLC s money.cfg (vyžaduje TLA+ toolbox/tlc — mimo npm build). *)
(***************************************************************************)
EXTENDS Integers, FiniteSets

CONSTANTS Accounts, MaxAmount, InitBalance

VARIABLES bal

RECURSIVE Sum(_)
Sum(f) ==
  IF DOMAIN f = {} THEN 0
  ELSE LET x == CHOOSE x \in DOMAIN f : TRUE
       IN f[x] + Sum([y \in (DOMAIN f \ {x}) |-> f[y]])

Total == Sum(bal)
InitialTotal == Cardinality(Accounts) * InitBalance

Init == bal = [a \in Accounts |-> InitBalance]

Amounts == 1 .. MaxAmount

(* Atomický převod: oba zápisy v JEDNOM kroku (bal'), a JEN když má zdroj  *)
(* krytí (modeluje conditional `$inc` s `balance >= amt`).                  *)
Transfer(from, to, amt) ==
  /\ from # to
  /\ bal[from] >= amt
  /\ bal' = [bal EXCEPT ![from] = @ - amt, ![to] = @ + amt]

(* Atomický odečet s krytím (modeluje debitIfSufficient). *)
Debit(acc, amt) ==
  /\ bal[acc] >= amt
  /\ bal' = [bal EXCEPT ![acc] = @ - amt]

Next ==
  \/ \E from, to \in Accounts, amt \in Amounts : Transfer(from, to, amt)
  \/ \E acc \in Accounts, amt \in Amounts : Debit(acc, amt)

Spec == Init /\ [][Next]_bal

(***************************************************************************)
(* Invarianty — TLC je ověří ve VŠECH dosažitelných stavech.              *)
(***************************************************************************)
TypeOK == bal \in [Accounts -> Int]

\* Žádný účet nesmí jít do mínusu (krytí drží pod jakýmkoli prokládáním).
NoOverdraft == \A a \in Accounts : bal[a] >= 0

\* Transfer nikdy nevytvoří ani nezničí peníze (Debit je úmyslné zmenšení,
\* proto MoneyConserved platí pro spec BEZ Debitu — viz money.cfg варianta).
MoneyConserved == Total = InitialTotal
=============================================================================
