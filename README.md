# n8n-nodes-linkedin-post-search-api

An [n8n](https://n8n.io/) community node that searches public LinkedIn posts by keyword. Give it a name, a company, a phrase, an event, or a #hashtag, and it returns the public posts that mention it, one item per post: the text, author, date, reactions, comments, images, and links. Filter to the past day, week, month, or year, or to a custom date range. It is backed by the [LinkedIn Post Search API](https://apify.com/johnvc/linkedin-post-search-api?fpr=9n7kx3) on [Apify](https://apify.com?fpr=9n7kx3) and bills per search page and per post returned, so there are no subscriptions and no minimums. No LinkedIn account, login, or cookie is needed.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Output](#output) · [Example workflows](#example-workflows) · [Pricing](#pricing) · [Resources](#resources)

## What it does

Give the node one or more keywords, and it returns one item per public LinkedIn post that mentions them. All the keywords on one input item are collected in a single Actor run. It also works as an **AI Agent tool**, so an agent can look up what people are posting about a topic on demand.

- Search LinkedIn posts by keyword: a person's name, a company, a product, an event, a phrase, or a #hashtag, each matched as an exact phrase
- Monitor brand mentions on LinkedIn with a daily past-day search, or track a hashtag over the past week
- Pull the posts about an event or news story inside a custom date range (something LinkedIn's own search cannot do)
- Find the most liked posts on a topic: every post comes with reactions and comments, ready to sort
- Get the full public post: text, author name and profile, author type and follower count, hashtags, tagged people and companies, images, videos, links, and up to 10 visible comments
- Choose how much data to return per post: Simplified, Raw, or Selected Fields

Typical uses: social listening and brand monitoring (who is talking about your company, your executives, or your competitors), PR and journalism research (every public post about an event, a story, or a person, in bulk), hashtag analytics, content research (what is resonating on a topic this week), and lead signals (people posting about a problem you solve).

## Installation

Follow the n8n [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/):

1. In n8n, open **Settings > Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-linkedin-post-search-api` as the npm package name.
4. Agree to the risks of using community nodes, then select **Install**.

After it installs, the **LinkedIn Post Search** node appears in the nodes panel.

> n8n Cloud only allows verified community nodes, so install this node on a self-hosted n8n instance.

## Credentials

You need a free [Apify account](https://apify.com?fpr=9n7kx3) and an API token.

1. Sign in to the [Apify Console](https://console.apify.com?fpr=9n7kx3).
2. Open **Settings > Integrations** and copy your **Personal API token**.
3. In n8n, create a new **Apify API** credential and paste the token.
4. Use the credential's **Test** button to confirm it works.

The node also supports **Apify OAuth2** if you prefer to connect that way.

## Operations

**Post > Search** finds the public posts that mention one or more keywords and returns one item per post.

| Parameter | Description |
| --- | --- |
| Keywords | Names, phrases, companies, or #hashtags to find, for example `Jackson Hole Symposium`, `Nvidia`, or `#semiconductors`. Each is searched as an exact phrase. Enter plain words; search operators and quote marks are refused. Required. Up to 20 per run. |
| Posted Within | Only posts from this recent period: Any Time (default), Past Day, Past Week, Past Month, or Past Year. Use Past Day for a daily mention monitor. Ignored when a start or end date is set. |
| Max Posts per Keyword | Stop after returning this many posts for one keyword (1 to 1,000, default 50). Caps cost. Busy topics can return several hundred; most niche phrases return fewer than 50. |
| Options > Start Date | Only posts published on or after this day (UTC). Overrides Posted Within. |
| Options > End Date | Only posts published on or before this day (UTC). Overrides Posted Within. |
| Options > Include Articles | Also search long-form LinkedIn articles for each keyword. Each keyword then runs two searches. Off by default. |
| Output | How much data to return: Simplified, Raw, or Selected Fields. |

### Coverage: what to expect

The API finds posts through public search results and then opens each post on LinkedIn, so it returns the public posts search engines have indexed, which is most public posts within a few hours of publishing, but never private posts or posts from closed groups. Each post carries the comments a signed-out visitor can see (up to 10), reactions and comments counts, but not the list of people who reacted or share counts. A post found by two of your keywords is returned once, under the first keyword that found it. Each run also writes a `RUN_SUMMARY` record to the run's key-value store on Apify with the number of search pages fetched, cache hits, posts delivered, and why each keyword stopped (it is not part of the node's output).

## Output

Each post is returned as its own n8n item. A keyword whose search could not be completed, or a post that could not be opened, returns one item with `resultType` set to `error` (never charged), so you can see what to retry. The API returns more than thirty fields per post, so the **Output** parameter lets you choose how much to return:

- **Simplified** (default): a compact object with `resultType`, `matchedKeyword`, `datePosted`, `authorName`, `authorType`, `authorUrl`, `text`, `numLikes`, `numComments`, `mediaType`, and `postUrl`. For an error item it returns `resultType`, `matchedKeyword`, and `errorMessage`. This mode is also used automatically when the node runs as an AI Agent tool, to keep responses small.
- **Raw**: every field the API returns for each post, using the original field names below.
- **Selected Fields**: pick exactly which fields to include.

A Simplified item looks like this (synthetic example):

```json
{
  "resultType": "post",
  "matchedKeyword": "Jackson Hole Symposium",
  "datePosted": "2026-08-22T14:05:11.000Z",
  "authorName": "Sam Sample",
  "authorType": "Person",
  "authorUrl": "https://www.linkedin.com/in/sam-sample-0000",
  "text": "Three takeaways from this year's Jackson Hole Symposium...",
  "numLikes": 58,
  "numComments": 4,
  "mediaType": "image",
  "postUrl": "https://www.linkedin.com/posts/sam-sample-0000_activity-7000000000000000000-abcd"
}
```

### Fields (Raw and Selected Fields)

| Field | Type | Description |
| --- | --- | --- |
| `resultType` | string | `post` (a public post or article that matched a keyword) or `error` (a keyword or post that could not be read, never charged) |
| `matchedKeyword` | string | The keyword, name, or hashtag from your input that found this post |
| `searchRank` | integer | The post's position on its search result page (1 = top) |
| `searchPage` | integer | The search result page the post was found on (1 = first page) |
| `postUrl` | string | The public URL of the post |
| `postId` | string | LinkedIn's post identifier. Stable per post and a good key for removing duplicates or comparing runs |
| `postType` | string | The kind of post: `post`, `article`, or `repost` |
| `mediaType` | string | What the post carries: `text`, `image`, `video`, `document`, or `article` |
| `datePosted` | string | When the post was published (ISO 8601, UTC) |
| `title` | string | The post or article title, when present |
| `text` | string | The post body text |
| `summary` | string | A one-line plain-language description of the post (author, engagement, date) |
| `hashtags` | array | Hashtags used in the post |
| `authorName` | string | The author's name or handle |
| `authorHeadline` | string | The author's headline, when shown |
| `authorUrl` | string | The author's public LinkedIn profile or company page URL |
| `authorType` | string | `Person` or `Organization` |
| `authorFollowers` | integer | The author's follower count, when available |
| `isInfluencer` | boolean | `true` when LinkedIn marks the author as an Influencer |
| `numLikes` | integer | Number of reactions on the post |
| `numComments` | integer | Number of comments on the post |
| `topComments` | array | Up to 10 visible comments, each with the commenter's name, date, text, and reactions |
| `images` | array | Image URLs attached to the post |
| `videos` | array | Video attachments on the post |
| `document` | object | A document or carousel attached to the post: title, page count, and cover pages, when present |
| `embeddedLinks` | array | External links referenced in the post |
| `taggedPeople` | array | People tagged in the post, with name and profile link |
| `taggedCompanies` | array | Companies tagged in the post, with name and page link |
| `resharedPost` | object | The post this post quotes or reshares: its id, URL, author, and text, when present |
| `fromCache` | boolean | `true` when the post was served from the shared result cache (fetched recently by any run). Billed the same |
| `fetchedAt` | string | When the post page was read from LinkedIn (ISO 8601, UTC) |
| `errorMessage` | string | Error rows only: what could not be done and why, in plain words |

Who reacted to a post, share counts, and private posts are not on LinkedIn's public pages, so the node does not return them.

## Example workflows

### 1. Monitor brand mentions on LinkedIn every morning

1. **Schedule Trigger**: every day at 7 AM.
2. **LinkedIn Post Search**: Keywords `Nvidia`, `Jensen Huang`, Posted Within `Past Day`, Max Posts per Keyword `50`.
3. **Slack**: post each item's `authorName`, `numLikes`, the first line of `text`, and `postUrl` to your comms channel.

### 2. Track a hashtag for the week and rank by engagement

1. **Schedule Trigger**: every Monday.
2. **LinkedIn Post Search**: Keywords `#semiconductors`, Posted Within `Past Week`, Max Posts per Keyword `200`, Output `Selected Fields` with `authorName`, `authorUrl`, `text`, `numLikes`, `numComments`, and `postUrl`.
3. **Sort**: by `numLikes` descending.
4. **Google Sheets**: append the top posts to your hashtag analytics sheet.

### 3. Collect every public post about an event for a story

1. **Manual Trigger**.
2. **LinkedIn Post Search**: Keywords `Jackson Hole Symposium`, Options Start Date `2026-08-20`, End Date `2026-08-24`, Max Posts per Keyword `500`, Output `Raw`.
3. **Convert to File**: export the items as CSV for your research notes, with `datePosted`, `authorName`, `authorHeadline`, `text`, and `postUrl`.

### 4. Let an AI Agent read the room on a topic

1. **AI Agent** node.
2. Attach **LinkedIn Post Search** as a tool.
3. Ask "What are people on LinkedIn saying about the Jackson Hole Symposium this week?" The agent calls the node (in Simplified mode) and answers from the returned posts.

## Pricing

This node calls the [LinkedIn Post Search API](https://apify.com/johnvc/linkedin-post-search-api?fpr=9n7kx3) on Apify, which is billed **pay-per-event** with no subscription and no minimums. You pay for each search result page fetched fresh (about 8 to 10 posts per page; pages served from the shared cache are free) and for each post returned. Error rows are never charged, and Max Posts per Keyword caps the spend per keyword. Apify's free plan includes monthly platform credits for trying it out. See the [Actor page](https://apify.com/johnvc/linkedin-post-search-api?fpr=9n7kx3) for current rates.

## Related nodes

Part of a suite of LinkedIn APIs for n8n that read only LinkedIn's public pages, with no login and no cookies:

- [n8n-nodes-linkedin-posts-api](https://www.npmjs.com/package/n8n-nodes-linkedin-posts-api): the posts from a specific profile or company page
- [n8n-nodes-linkedin-company-api](https://www.npmjs.com/package/n8n-nodes-linkedin-company-api): company firmographics (size, industry, headquarters, followers)
- [n8n-nodes-linkedin-company-employees-api](https://www.npmjs.com/package/n8n-nodes-linkedin-company-employees-api): the people who work at a company
- [n8n-nodes-linkedin-profile-api](https://www.npmjs.com/package/n8n-nodes-linkedin-profile-api): full public profiles from profile URLs
- [n8n-nodes-linkedin-jobs-api](https://www.npmjs.com/package/n8n-nodes-linkedin-jobs-api): the roles a company is hiring for

## Resources

- [LinkedIn Post Search API on Apify](https://apify.com/johnvc/linkedin-post-search-api?fpr=9n7kx3)
- [npm package](https://www.npmjs.com/package/n8n-nodes-linkedin-post-search-api)
- [Python and MCP example repo](https://github.com/johnisanerd/Apify-LinkedIn-Post-Search-API)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Apify n8n integration guide](https://docs.apify.com/platform/integrations/n8n)

## License

[MIT](LICENSE.md)
