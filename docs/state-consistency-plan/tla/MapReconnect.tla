---------------------------- MODULE MapReconnect ----------------------------
\* Protokol A — reconnect gap recovery na taktické mapě (osa RJ).
\*
\* Model jednoho klienta vůči autoritativnímu serveru. Server posouvá stav mapy
\* (operace = monotónní verze). Klient stav zrcadlí přes WS eventy. Otázka:
\* KONVERGUJE klientův stav zpět k serveru po výpadku spojení?
\*
\* Klíčová věc, kterou tahle spec DOKAZUJE: bez refetch-on-reconnect existuje
\* prokládání (ServerOp během disconnect okna), po kterém klient zůstane navždy
\* pozadu == tichá divergence (= třída bugů K-S3 / K-S4 / K-S9).
\*
\* Spusť TLC dvakrát (viz MapReconnect.cfg):
\*   RefetchOnReconnect = FALSE  ->  TLC najde porušení invariantu Convergence
\*   RefetchOnReconnect = TRUE   ->  Convergence i Safety drží
\* Rozdíl mezi těmi dvěma běhy JE formální důkaz, proč reconnect potřebuje refetch.

EXTENDS Naturals

CONSTANTS
  MaxOps,             \* horní mez operací (bounded model checking)
  RefetchOnReconnect  \* TRUE = klient po reconnectu dožene server (refetch);
                      \* FALSE = jen re-join, žádný refetch (dnešní RJ bug)

VARIABLES
  serverSeq,  \* autoritativní verze stavu mapy na serveru
  clientSeq,  \* poslední verze, kterou klient aplikoval
  connected,  \* je klient připojený?
  inflight    \* event vyrobený serverem, čekající na doručení (0 = žádný)

vars == << serverSeq, clientSeq, connected, inflight >>

TypeOK ==
  /\ serverSeq \in 0..MaxOps
  /\ clientSeq \in 0..MaxOps
  /\ connected \in BOOLEAN
  /\ inflight  \in 0..MaxOps

Init ==
  /\ serverSeq = 0
  /\ clientSeq = 0
  /\ connected = TRUE
  /\ inflight  = 0

\* Server provede operaci (posune stav). Event vznikne pro klienta JEN když je
\* připojený; při disconnectu se nikdy nevyrobí == mezera (gap), kterou musí
\* dohnat reconnect.
ServerOp ==
  /\ serverSeq < MaxOps
  /\ serverSeq' = serverSeq + 1
  /\ inflight'  = IF connected THEN serverSeq + 1 ELSE inflight
  /\ UNCHANGED << clientSeq, connected >>

\* Doručení čekajícího eventu klientovi (aplikace operace na clientView).
Deliver ==
  /\ connected
  /\ inflight > 0
  /\ clientSeq' = inflight
  /\ inflight'  = 0
  /\ UNCHANGED << serverSeq, connected >>

\* Výpadek spojení. Případný inflight event se ztrácí (Socket.IO ho po dropu zahodí).
Disconnect ==
  /\ connected
  /\ connected' = FALSE
  /\ inflight'  = 0
  /\ UNCHANGED << serverSeq, clientSeq >>

\* Obnovení spojení. S refetch klient dožene server; bez něj zůstane pozadu.
Reconnect ==
  /\ ~connected
  /\ connected' = TRUE
  /\ clientSeq' = IF RefetchOnReconnect THEN serverSeq ELSE clientSeq
  /\ UNCHANGED << serverSeq, inflight >>

Next ==
  \/ ServerOp
  \/ Deliver
  \/ Disconnect
  \/ Reconnect

\* Fairness: doručení i reconnect se nakonec stanou (jinak by liveness byla triviálně nepravdivá).
Spec == Init /\ [][Next]_vars /\ WF_vars(Deliver) /\ WF_vars(Reconnect)

------------------------------------------------------------------------------
\* ---- Invarianty (cíl traceability do L7) ----

\* SAFETY: klient nikdy nepředběhne server (žádný stav z budoucnosti).
Safety == clientSeq <= serverSeq

\* Ustálený stav = připojeno a nic neletí.
Quiescent == connected /\ inflight = 0

\* CONVERGENCE: v ustáleném stavu je klient přesně synchronní se serverem.
\* S RefetchOnReconnect=FALSE TLC najde protipříklad:
\*   Disconnect -> ServerOp (gap) -> Reconnect(bez refetch) -> Quiescent, ale clientSeq < serverSeq.
Convergence == Quiescent => (clientSeq = serverSeq)

\* LIVENESS (temporal): stav se nakonec vždy sblíží. Drží jen s refetch + fairness.
Liveness == []<>(clientSeq = serverSeq)
=============================================================================
