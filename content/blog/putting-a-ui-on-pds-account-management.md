---
title: "Putting a UI on PDS account management"
date: "2026-07-01"
description: "Getting AT Protocol account management out of the terminal."
tags: ["atproto", "pds"]
---

*Our first milestone for eny.space: a web UI for creating, managing, and migrating AT
Protocol accounts — so the parts that are currently a fragile terminal exercise become
something you can do safely, yourself, from a browser.*

## What eny.space is (and is becoming)

eny.space started as the infrastructure under an app we're building (eny.social) — but it's
turning into its own thing, and account management is its first milestone.

Right now it's **managed PDS hosting**: you get started directly, without touching Docker, a
VPS, or any of the devops underneath. From there the plan is to grow into a **full PDS
management interface** – the subject of this post – and, further out, something closer to a
**personal social cloud provider**: your own corner of the atmosphere — a store you control
that any number of apps can build on, rather than data locked inside one platform. Dan
Abramov's post [*A Social Filesystem*](https://overreacted.io/a-social-filesystem/)
makes the case for exactly this: treating your social data like files you own, with open
formats as the interface so apps interoperate instead of walling each other off. A managed
PDS is a concrete piece of that picture: it's the store. And it's very much where we want
to go.

This post is about the first concrete step: getting account management out of the terminal.

## It used to live in a terminal

Getting a PDS *running* is basically solved: image, hosted templates, a cheap VPS that
auto-updates. The awkward part is everything after: creating accounts, inviting people,
resetting a password, and especially **migrating an existing account in from another
provider**.

There are good tools for this, and they genuinely help. `goat` and `pdsadmin` cover the
command line; [PDS MOOver](https://pdsmoover.com/) even brings migration into the browser
with a real UI, and adds automated backups and a missing-blob recovery step on top. None of
this is a knock on them. But they share a property that keeps the risk around: the migration
itself runs **client-side**. You (your browser tab) drive a stateful, hard-to-undo
change to your identity and data, and if it stalls, you own the mess. (That a tool needs a
"find your missing blobs" feature at all is a fair sign of how lossy a client-side move can
be.)

Migration is the sharp edge. The flow creates a deactivated account, exports your repo,
imports everything (blobs included and it takes a while), updates your DID document,
and activates. If any of that stalls – your laptop sleeps, the network drops,
a step errors halfway – there's **no resume, no pause, no checkpoint**. You're left in a
partial state, and in the worst case looking at what feels like data loss.
We hit exactly this ourselves (more below).

That's the motivation: a UI where you can do all of this yourself, with the fragile,
stateful parts handled on a server that can actually track progress and recover, instead of
one-shotting commands in your terminal.

We see people who go selfhosted, testing it first with one or two test users, before finally switching.
With an easy and safe way to do it, we want to encourage more users migrating their identities
over without fear. Or even go selfhosted. That's basically our attempt and motivation to
push decentralization further.

## The pattern underneath

The encouraging thing is that most of this is **standard XRPC**. The PDS already exposes the
admin surface; the work is wrapping it carefully, server-side, so the admin credential and
the stateful logic don't live on a user's machine.

Each action is the same shape. A server route that holds the credential and forwards a
standard call. Creating an account is two calls behind one button:

```
com.atproto.server.createInviteCode   { useCount: 1 }
com.atproto.server.createAccount      { handle, password, email, inviteCode }
```

Listing accounts is `com.atproto.sync.listRepos`
enriched with `com.atproto.admin.getAccountInfos`.
Password reset is `com.atproto.server.requestPasswordReset`.
Delete is `com.atproto.admin.deleteAccount`.

The PDS admin authenticates with plain HTTP Basic auth, so the one rule that matters is: keep
that credential on the server, never in the browser.

The UI is thin on purpose. The point isn't the wrapper, it's moving the risky, stateful
work off the client.

## Where the management interface goes next

Account create / migrate / invite / reset is the starting set. The same admin surface
supports a lot more, and these are the directions we want to explore:

- **Resumable migration.** The highest-value one, and the gap a client-side tool, browser
  or CLI, structurally can't close: a server-tracked migration that can pause, resume, and
  recover from a half-finished state instead of dying with the tab. The work runs on
  infrastructure that's already holding your account, so it can checkpoint and retry.
- **Identity operations.** Handle changes (`updateAccountHandle`), email updates
  (`updateAccountEmail`), and PLC rotation / recovery-key management so a lost credential
  isn't a lost account.
- **Backups & portability.** `com.atproto.sync.getRepo` returns the full repo as a CAR file
  — the basis for one-click export and scheduled off-site backups. MOOver already offers
  this as a standalone service; the difference for a host is having it built in by default,
  for the account it's already keeping.
- **Account state & moderation.** Activate / deactivate without deleting, and the takedown /
  suspension surface (`updateSubjectStatus`) for anyone hosting more than themselves.
- **Capacity & health.** `listRepos` plus repo sizes is a storage view; the firehose gives
  activity and — importantly — whether your PDS is actually being seen by the relay.

We haven't built these yet, and we're not claiming to be the only ones who could. For us it
just make sense to have it all in one place (space, hehe).

## The footgun that started this

Concretely, here's the bug that convinced us the CLI flow needs a safer wrapper, from
migrating our own account in.

A `goat` migration deliberately leaves the new account **deactivated** so you can verify the
import first. The final `goat account activate` is the switch, and it's the step that's easy
to miss in the manual flow, or if the one-shot stalls. Until you flip it, the account is
fully migrated *and completely invisible*: the AppView returns `AccountDeactivated`, the
profile 404s, and it looks like the data is gone. It isn't, but nothing tells you that.

There's a subtler half: a self-hosted PDS only reaches the network's relay if it's told to
announce itself (`PDS_CRAWLERS=https://bsky.network`). Miss it and you can activate all day
while the AppView never hears about it — a manual `com.atproto.sync.requestCrawl` unsticks
it. ([hose.cam's PDS debugger](https://debug.hose.cam/) is good for catching exactly this.
It checks identity resolution and relay visibility, and gives you a manual crawl button in
one place.)

A one-shot terminal command makes both of these easy to get wrong and offers nothing when
they go sideways. A stateful flow that knows it's mid-migration can show you "you're
activated but not yet visible, here's why". This is exactly what we want to build.

## Where this fits

Account management is milestone one on the way from managed hosting to a real PDS management
interface and eventually that personal-social-cloud corner of the atmosphere.

We'll keep you updated, since the issues here don't just affect us and we want to contribute
as much as possible to the community.

> The future depends on the atmosphere.