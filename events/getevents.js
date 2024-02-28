const { Events } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');
const axios = require('axios');
const { twtkey, twtSecret, twtToken, acctwtSecret } = require('../config.json');

// Log into twitter
const userClient = new TwitterApi({
	appKey: twtkey,
	appSecret: twtSecret,
	accessToken: twtToken,
	accessSecret: acctwtSecret,
});
const rwClient = userClient.readWrite;

module.exports = {
	name: Events.GuildScheduledEventUpdate,
	async execute(createdevent) {
		// Put the description in a variable, if the description is too long, it will get truncated at line 34
		let truncDesc = '';
		console.log(createdevent.description);
		let tweet = `MondoCat Event starting: ${createdevent.name}\n ${truncDesc}\nYou can join this event on our Discord server https://discord.gg/mondocat`;
		// Configure the tweet in a const so we can calculate the characters and not have to change the tweet
		// Use tweetNoVariables to calculate character limit, tweet to send.
		const tweetNoVariables = 'MondoCat Event starting: You can join this event on our Discord server https://discord.gg/mondocat';
		// Find the point in the description where we need to cut from
		const descriptionIndex = createdevent.description.search('\u{1D05}\u{1D07}\u{A731}\u{1D04}\u{280}\u{26A}\u{1D18}\u{1D1B}\u{26A}\u{1D0F}\u{274}');
		console.log(descriptionIndex);
		// Cut the description
		const description = createdevent.description.substring(descriptionIndex + 13, descriptionIndex.length);
		console.log(description);
		// Set the offset for the Twitter character limit, the tweet we send has 98 static characters
		const characterLimitOffset = tweetNoVariables.length + createdevent.name.length;
		// Add the offset to the limit
		const characterLimit = 280 - characterLimitOffset;
		// If the length of the string is more than the character limit, cut it and add an ellipsis
		if (description.length >= characterLimit) {
			truncDesc = description.substring(1, characterLimit - 20) + '...';
			// We need to set the variables in the string, and this is the only way I could come up with💀
			tweet = `MondoCat Event starting: ${createdevent.name}\n ${truncDesc}\nYou can join this event on our Discord server https://discord.gg/mondocat`;
		}
		else {
			tweet = `MondoCat Event starting: ${createdevent.name}\n ${description}\nYou can join this event on our Discord server https://discord.gg/mondocat`;
		}
		if (createdevent.status == '1') {
			console.log('Event Starting:');
			// Check if event has image attached
			console.log(tweet);
			if (createdevent.image != null) {
				// Download the event image into the buffer
				const downStream = await axios({
					method: 'GET',
					responseType: 'arraybuffer',
					url: createdevent.coverImageURL(['png']),
				}).catch(function(error) {
					console.error(error);
				});
				// Upload image to Twitter servers
				const mediaId = await Promise.all([
					rwClient.v1.uploadMedia(downStream.data, { mimeType: 'png' }).then(console.log('Finished uploading image')),
				]);
				// Send tweet
				rwClient.v2.tweet({
					text: `${tweet}`,
					media: { media_ids: mediaId },
				});
			}
			else {
				// If event doesn't have image set, just send the name and description
				rwClient.v2.tweet({
					text: `${tweet}`,
				});
			}
		}
	},
};