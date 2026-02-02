# GitWrapped

View your GitHub profile stats as a clean dashboard or a story-style "wrapped" presentation.

**Live:** [Coming soon](#) <!-- Replace with your Vercel URL after deployment -->

## What it does

GitWrapped fetches public data from the GitHub API and presents it in two modes:

1. **Dashboard mode**: A clean, table-style view of your repos, languages, and stats
2. **Wrapped mode**: A slide-by-slide summary, similar to Spotify Wrapped

No login required. Everything is based on publicly available GitHub data.

## What data it shows

All stats come from the [GitHub REST API](https://docs.github.com/en/rest):

- **Repositories**: Public repos, stars, forks
- **Languages**: Byte-based breakdown (Jupyter notebooks are counted as Python)
- **Profile info**: Bio, location, follower count, account age
- **Activity**: Recently active (based on repo push dates)

### What it *doesn't* show

We intentionally leave out metrics that require:
- Authenticated access (private repos, contribution graphs)
- Scraping (commit streaks, coding hours)
- Unreliable calculations ("top X%" comparisons)

## Running locally

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
# Clone the repo
git clone https://github.com/asynced24/gitwrapped.git
cd gitwrapped

# Install dependencies
npm install

# (Optional) Add a GitHub token for higher rate limits
# Create a .env.local file:
echo "GITHUB_TOKEN=your_github_personal_access_token" > .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a GitHub username.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | No | GitHub personal access token. Increases rate limit from 60 to 5000 requests/hour. |

To create a token:
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token with no scopes (public data only)
3. Add it to `.env.local`

## Tech stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS variables
- **Animations**: Framer Motion
- **Data**: GitHub REST API

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Home page with username input
│   ├── dashboard/[username]/ # User dashboard
│   │   ├── page.tsx          # Server component (data fetching)
│   │   └── DashboardClient.tsx # Client component (UI)
│   ├── globals.css           # Design system
│   └── layout.tsx            # Root layout
├── components/
│   ├── LanguageBar.tsx       # Language breakdown bar
│   ├── RepoCard.tsx          # Repository card
│   ├── ModeToggle.tsx        # Dashboard/Wrapped toggle
│   └── WrappedStory.tsx      # Story-style presentation
├── lib/
│   └── github.ts             # GitHub API functions
└── types/
    └── github.ts             # TypeScript types
```

## Notes on language data

GitHub's language API reports bytes per language, which can be misleading:

- Generated files (like `package-lock.json`) inflate JavaScript counts
- Jupyter Notebooks report as their own language, even though they're mostly Python
- Markup (HTML, CSS, Markdown) often dominates byte counts

We handle this by:
- Reassigning "Jupyter Notebook" bytes to Python
- Labeling markup languages separately
- Being transparent about what "percentage" means (bytes, not lines or time)
