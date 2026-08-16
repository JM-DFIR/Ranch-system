# Getting started with LIMS

A walkthrough for the first session, and the day-to-day basics —
written for the ranch owner and ranch managers, not for developers.

## Before your first animal

1. **Log in** with the account you were given.
2. **Create your first ranch.** Every animal belongs to a ranch, so
   this comes first — give it a name and location. If you run more
   than one property, add each one here; you can always add more
   later.
3. **Check your species and breeds.** Go to Admin > Reference data.
   Cattle, Goat and Sheep are already there — add anything else you
   keep, and set a tag prefix if you want (e.g. goats "M", cattle
   "MUX ") so the app can suggest the next tag number for you while
   you're enrolling.

The dashboard shows a short checklist for exactly these steps the
first time you sign in, so you'll see them again there too.

## Your first enrollment session

This is the one session worth doing carefully — everything else in the
app assumes your animals are already recorded, so getting this part
comfortable matters more than anything else here.

You have two ways to record an animal, and you don't have to pick just
one:

- **Enrollment Mode** — on your phone, in the field, right now. Open
  the camera, photograph the animal, fill in its tag number, species
  and sex, and save. Designed to take under 20 seconds per animal once
  you're used to it. Works without signal — your entries queue up and
  sync automatically once you're back in range.
- **Batch Enrollment** — at a desk, from photos you already took.
  Photograph animals through the day with your phone's normal camera
  app, then upload the whole batch from a laptop later and work
  through them on one screen.

Try both once and use whichever fits how you actually work. There's no
wrong choice, and you can switch between them any day.

**A note on tag numbers:** the app will suggest the next number for a
species if you've set a prefix, but you can always type whatever tag
the animal already has — a bought-in animal often arrives with a tag
that doesn't match your own pattern, and that's fine.

## Bringing on a manager

Admin > Users & roles > Invite user. Enter their email and choose
"Ranch manager," then copy the link it gives you and send it to them
yourself — the app doesn't send the email for you yet. They'll set
their own name and password from that link.

Once they've accepted, assign them to the ranch(es) they'll actually
work on from that same Users & roles screen — a manager only sees and
records against ranches they're assigned to.

## Day to day

- **Animals** — your full herd, searchable and filterable by ranch,
  species, status and more.
- **Health** — vaccinations, treatments, illnesses and vet visits, all
  in one hub, plus the **Attention queue** — animals with something
  overdue (a vaccination past due, an illness still unresolved, no
  health record in a while). Check this regularly; it's built to be
  your "what needs doing" list.
- **Breeding, Movements, Mortality, Feeding & Care** — each has its own
  register and its own "record" action, reachable from the animal's
  own profile, from the register itself, or from the dashboard's quick
  actions.
- **Reports** — a gallery of ready-made reports (inventory, health
  compliance, breeding performance, and more), each exportable to CSV.

## Working offline

Five actions work without signal and queue up automatically: adding an
animal, attaching a photo, and recording a health event, a weight, or
a movement. Everything else needs a connection and will tell you so
plainly if you try it offline, rather than pretending to save and
losing your entry.

If two people are offline at once and somehow pick the exact same tag
number for two different animals, the app catches that when you're
back online — it'll show you the conflict by tag number with a
one-tap "rename and resync" fix, rather than silently keeping only one
of them.

## If something goes wrong

Ask whoever set this system up for you (see `docs/runbook.md` for the
technical side) — but a few things worth trying first:

- **A save seems stuck** — check the sync indicator (usually near the
  top of the screen). If you're offline, it'll say so.
- **You can't do something you think you should be able to** — check
  whether you're a Ranch manager assigned to that specific ranch, or
  whether the action is owner-only (user management, organisation
  settings, and the audit log are owner-only; almost everything else
  isn't).
