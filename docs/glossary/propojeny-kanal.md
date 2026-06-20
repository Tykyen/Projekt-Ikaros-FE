---
name: propojeny-kanal
aliases: [propojený kanál, linked membership, linkedWorldGroup, kanál družiny]
category: chat
related: [[kanal], [konverzace], [group-emblem]]
status: draft
---

# Propojený kanál

**TL;DR:** [[kanal|Chat kanál]] navázaný na družinu (skupinu) světa — členství a znak skupiny se zrcadlí do kanálu.

## Detail

Propojený kanál je [[kanal|kanál]], jehož přístup a vzhled jsou navázané na herní skupinu (družinu). Znak skupiny (`WorldSettings.groupImages`) se read-time zrcadlí do ikony kanálu (`getGroupsWithChannels`, `ChatGroup.linkedWorldGroup`).

📚 Kanál Postavy navíc drží auto soukromé konverzace vázané na hráče (`linkedMemberUserId`) — viz chat 6.7.

## Kde se objevuje

- v dokumentaci: [13-komunikace-sveta.md](docs/funkce/13-komunikace-sveta.md)
- v UI: kanály vázané na skupiny v chatu

## Nepleť s

- **[[kanal]]** — obecná skupina konverzací; propojený kanál je navázán na herní družinu.
