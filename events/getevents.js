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
		// Find the point in the description where we need to cut from
		const descriptionIndex = createdevent.description.search(':`');
		// Cut the description
		const description = createdevent.description.substring(descriptionIndex + 1, descriptionIndex.length);
		// Set the offset for the Twitter character limit, the tweet we send has 98 static characters
		const characterLimitOffset = 98 + createdevent.name.length;
		// Add the offset to the limit
		const characterLimit = 280 - characterLimitOffset;
		// This is a surprise tool that will help us later
		let truncDesc = '';
		// If the length of the string is more than the character limit, cut it and add an ellipsis
		if (description.length >= characterLimit) {
			truncDesc = description.substring(1, characterLimit - 20) + '...';
		}
		if (createdevent.status == '1') {
			console.log('Event Starting:');
			// Check if event has image attached
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
					text: `MondoCat Event starting: ${createdevent.name}\n ${truncDesc}\nYou can join this event on our Discord server https://discord.gg/mondocat`,
					media: { media_ids: mediaId },
				});
			}
			else {
				// If event doesn't have image set, just send name
				rwClient.v2.tweet({
					text: `MondoCat Event starting ${createdevent.name}\n ${truncDesc}\nYou can join this event on our Discord server https://discord.gg/mondocat`,
				});
			}
		}
	},
};