import { IDataObject, IExecuteFunctions, INodeProperties, NodeOperationError } from 'n8n-workflow';

/**
 * Normalize a string-list parameter: accept an array (the usual multiple-values UI) or a
 * single string (an expression or an AI-agent value, one entry per line or comma-separated),
 * trim every entry, and drop empty ones.
 */
function toStringList(value: unknown): string[] {
	const raw = Array.isArray(value)
		? value
		: typeof value === 'string'
			? value.split(/[\r\n,]/)
			: [];
	return raw.map((entry) => String(entry ?? '').trim()).filter((entry) => entry.length > 0);
}

/**
 * Build the Apify Actor input from node parameters.
 * Only the real Actor inputs are sent; the Output / Fields parameters shape the
 * data we return, they are not part of the Actor input.
 */
export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	const input: Record<string, any> = { ...defaultInput };

	const keywords = toStringList(context.getNodeParameter('keywords', itemIndex, []));
	if (!keywords.length) {
		throw new NodeOperationError(
			context.getNode(),
			'Add at least one keyword: a name, a phrase, a company, or a #hashtag',
			{ itemIndex },
		);
	}
	input.keywords = keywords;

	input.maxPostsPerKeyword = context.getNodeParameter('maxPostsPerKeyword', itemIndex, 50);

	const window = context.getNodeParameter('postedWithin', itemIndex, 'any') as string;
	input.postedWithin = window;

	// Advanced settings are sent only when the user adds them, so the Actor's own
	// defaults apply otherwise. A custom date range overrides the rolling window.
	const options = context.getNodeParameter('options', itemIndex, {}) as IDataObject;
	if (options.startDate) {
		input.startDate = String(options.startDate).slice(0, 10);
	}
	if (options.endDate) {
		input.endDate = String(options.endDate).slice(0, 10);
	}
	if (options.includeArticles !== undefined) {
		input.includeArticles = options.includeArticles;
	}

	return input;
}

const showForGetMany = { show: { resource: ['post'], operation: ['search'] } };

const resourceProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Post',
				value: 'post',
			},
		],
		default: 'post',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['post'],
			},
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search public posts by keyword',
				description:
					'Find the public posts that mention a keyword, name, phrase, or hashtag, one item per post',
			},
		],
		default: 'search',
	},
];

const actorProperties: INodeProperties[] = [
	{
		displayName: 'Keywords',
		name: 'keywords',
		type: 'string',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Keyword' },
		required: true,
		default: [],
		placeholder: 'e.g. Jackson Hole Symposium or #semiconductors',
		description:
			'Names, phrases, companies, or #hashtags to find, each searched as an exact phrase across public posts. Enter plain words; search operators and quote marks are refused. Up to 20 per run.',
		displayOptions: showForGetMany,
	},
	{
		displayName: 'Posted Within',
		name: 'postedWithin',
		type: 'options',
		options: [
			{ name: 'Any Time', value: 'any' },
			{ name: 'Past Day', value: 'day' },
			{ name: 'Past Month', value: 'month' },
			{ name: 'Past Week', value: 'week' },
			{ name: 'Past Year', value: 'year' },
		],
		default: 'any',
		description:
			'Only return posts from this recent period. Use Past Day for a daily mention monitor. Ignored when a start or end date is set in Options.',
		displayOptions: showForGetMany,
	},
	{
		displayName: 'Max Posts per Keyword',
		name: 'maxPostsPerKeyword',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 1000 },
		description:
			'Stop after returning this many posts for one keyword. Caps cost. Busy topics can return several hundred; most niche phrases return fewer than 50.',
		displayOptions: showForGetMany,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: showForGetMany,
		options: [
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description: 'Only posts published on or before this day (UTC). Overrides Posted Within.',
			},
			{
				displayName: 'Include Articles',
				name: 'includeArticles',
				type: 'boolean',
				default: false,
				description:
					'Whether to also search long-form LinkedIn articles for each keyword. Each keyword then runs two searches.',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description: 'Only posts published on or after this day (UTC). Overrides Posted Within.',
			},
		],
	},
];

const outputProperties: INodeProperties[] = [
	{
		displayName: 'Output',
		name: 'output',
		type: 'options',
		noDataExpression: true,
		displayOptions: showForGetMany,
		options: [
			{
				name: 'Raw',
				value: 'raw',
				description: 'Return every field the API produces for each post',
			},
			{
				name: 'Selected Fields',
				value: 'selected',
				description: 'Choose exactly which fields to return',
			},
			{
				name: 'Simplified',
				value: 'simplified',
				description: 'Return a compact set of the most useful fields for each post',
			},
		],
		default: 'simplified',
		description: 'How much data to return for each post',
	},
	{
		displayName: 'Fields to Include',
		name: 'fields',
		type: 'multiOptions',
		displayOptions: {
			show: { resource: ['post'], operation: ['search'], output: ['selected'] },
		},
		options: [
			{ name: 'Author Followers', value: 'authorFollowers' },
			{ name: 'Author Headline', value: 'authorHeadline' },
			{ name: 'Author Name', value: 'authorName' },
			{ name: 'Author Type', value: 'authorType' },
			{ name: 'Author URL', value: 'authorUrl' },
			{ name: 'Comments', value: 'numComments' },
			{ name: 'Date Posted', value: 'datePosted' },
			{ name: 'Document', value: 'document' },
			{ name: 'Embedded Links', value: 'embeddedLinks' },
			{ name: 'Error Message', value: 'errorMessage' },
			{ name: 'Fetched At', value: 'fetchedAt' },
			{ name: 'From Cache', value: 'fromCache' },
			{ name: 'Hashtags', value: 'hashtags' },
			{ name: 'Images', value: 'images' },
			{ name: 'Is Influencer', value: 'isInfluencer' },
			{ name: 'Matched Keyword', value: 'matchedKeyword' },
			{ name: 'Media Type', value: 'mediaType' },
			{ name: 'Post ID', value: 'postId' },
			{ name: 'Post Type', value: 'postType' },
			{ name: 'Post URL', value: 'postUrl' },
			{ name: 'Reactions', value: 'numLikes' },
			{ name: 'Reshared Post', value: 'resharedPost' },
			{ name: 'Result Type', value: 'resultType' },
			{ name: 'Search Page', value: 'searchPage' },
			{ name: 'Search Rank', value: 'searchRank' },
			{ name: 'Summary', value: 'summary' },
			{ name: 'Tagged Companies', value: 'taggedCompanies' },
			{ name: 'Tagged People', value: 'taggedPeople' },
			{ name: 'Text', value: 'text' },
			{ name: 'Title', value: 'title' },
			{ name: 'Top Comments', value: 'topComments' },
			{ name: 'Videos', value: 'videos' },
		],
		default: ['postUrl', 'datePosted', 'authorName', 'text', 'numLikes', 'numComments', 'matchedKeyword'],
		description: 'Which fields to return when Output is set to Selected Fields',
	},
];

const authenticationProperties: INodeProperties[] = [
	{
		displayName: 'Authentication',
		name: 'authentication',
		type: 'options',
		options: [
			{
				name: 'API Key',
				value: 'apifyApi',
			},
			{
				name: 'OAuth2',
				value: 'apifyOAuth2Api',
			},
		],
		default: 'apifyApi',
		description: 'Choose which authentication method to use',
	},
];

export const properties: INodeProperties[] = [
	...resourceProperties,
	...actorProperties,
	...outputProperties,
	...authenticationProperties,
];
