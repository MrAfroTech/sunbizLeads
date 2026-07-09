/**
 * Serves Chaos Mastery consumer landing HTML from chaos-mastery-landing-pages/.
 * CHAPTER_LANDING_ROUTES must stay in sync with chaos-mastery-landing-pages/vercel.json rewrites (public deploy).
 *
 * Usage: from chaos-mastery-web: npm run start:landings
 * Default: http://localhost:3847/chapter/1 … /chapter/21
 */

const path = require('path');
const express = require('express');

const PORT = parseInt(process.env.PORT || '3847', 10);
const STATIC_ROOT = path.join(__dirname, '..', 'chaos-mastery-landing-pages');

/** Registered routes — source of truth for public chapter URLs */
const CHAPTER_LANDING_ROUTES = [
  { chapter: 1, path: '/chapter/1', title: 'Hospitality Was Always Human', file: 'landing-hospitality-was-always-human.html' },
  { chapter: 2, path: '/chapter/2', title: 'The Guest Who Changed Everything', file: 'landing-the-guest-who-changed-everything.html' },
  { chapter: 3, path: '/chapter/3', title: 'The Urban Venue Era', file: 'landing-the-urban-venue-era.html' },
  { chapter: 4, path: '/chapter/4', title: 'The Stadium Opportunity', file: 'landing-the-stadium-opportunity.html' },
  { chapter: 5, path: '/chapter/5', title: 'When Hospitality Was at Its Best', file: 'landing-when-hospitality-was-at-its-best.html' },
  { chapter: 6, path: '/chapter/6', title: 'The Tools Made It Worse', file: 'landing-the-tools-made-it-worse.html' },
  { chapter: 7, path: '/chapter/7', title: 'The Hidden Cost of a Bad Stack', file: 'landing-the-hidden-cost-of-a-bad-stack.html' },
  { chapter: 8, path: '/chapter/8', title: 'Why Your Best People Keep Leaving', file: 'landing-why-your-best-people-keep-leaving.html' },
  { chapter: 9, path: '/chapter/9', title: "You're Paying for the Problem", file: 'landing-youre-paying-for-the-problem.html' },
  { chapter: 10, path: '/chapter/10', title: "You Don't Actually Know Your Guests", file: 'landing-you-dont-know-your-guests.html' },
  { chapter: 11, path: '/chapter/11', title: 'The Only Thing Guests Remember', file: 'landing-the-only-thing-guests-remember.html' },
  { chapter: 12, path: '/chapter/12', title: 'The Wait Is Killing Your Revenue', file: 'landing-the-wait-is-killing-your-revenue.html' },
  { chapter: 13, path: '/chapter/13', title: 'Build It So They Stay', file: 'landing-build-it-so-they-stay.html' },
  { chapter: 14, path: '/chapter/14', title: 'Events Are Operations, Not Magic', file: 'landing-events-are-operations-not-magic.html' },
  { chapter: 15, path: '/chapter/15', title: "Keep the People Who Know What They're Doing", file: 'landing-keep-the-people-who-know-what-theyre-doing.html' },
  { chapter: 16, path: '/chapter/16', title: 'What Happens When It All Works Together', file: 'landing-what-happens-when-it-all-works-together.html' },
  { chapter: 17, path: '/chapter/17', title: 'One System. Fewer Problems.', file: 'landing-one-system-fewer-problems.html' },
  { chapter: 18, path: '/chapter/18', title: 'The Venue That Runs Itself', file: 'landing-the-venue-that-runs-itself.html' },
  { chapter: 19, path: '/chapter/19', title: 'From Arrival to Last Call', file: 'landing-from-arrival-to-last-call.html' },
  { chapter: 20, path: '/chapter/20', title: 'What the Best Operators Do Differently', file: 'landing-what-the-best-operators-do-differently.html' },
  { chapter: 21, path: '/chapter/21', title: 'What Killed the Greats', file: 'landing-what-killed-the-greats.html' },
];

const app = express();

CHAPTER_LANDING_ROUTES.forEach(({ path: routePath, file }) => {
  app.get(routePath, (req, res) => {
    res.sendFile(path.join(STATIC_ROOT, file), (err) => {
      if (err) res.status(404).send('Landing page not found');
    });
  });
});

app.use(express.static(STATIC_ROOT, { index: 'index.html', extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`Chaos Mastery landing pages → http://localhost:${PORT}`);
  console.log(`Chapter URLs (examples): http://localhost:${PORT}/chapter/1 … /chapter/21`);
});
