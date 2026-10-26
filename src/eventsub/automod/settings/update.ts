import * as Main from "../../..";

/**
 * ## [automod.settings.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodsettingsupdate)
 * Sends a notification when a broadcaster’s automod settings are updated.

 * ### Authorization
 * Requires a user access token that includes the `moderator:read:automod_settings` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:read:automod_settings` scope for the moderator.

 * The moderator must be a moderator or broadcaster for the specified broadcaster.
 */
export interface RequestBody extends Main.EventSub._RequestBody {
	type: "automod.settings.update";
	version: "1";
	condition: Condition;
	transport: Main.EventSub.Transport;
}
export function RequestBody(condition: Condition, transport: Main.EventSub.Transport): RequestBody {
	return {type: "automod.settings.update", version: "1", condition, transport};
}

export interface Condition {
	/** User ID of the broadcaster (channel). */
	broadcaster_user_id: string;
	/** User ID of the moderator. */
	moderator_user_id: string;
}

/**
 * ## [automod.settings.update](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#automodsettingsupdate)
 * Sends a notification when a broadcaster’s automod settings are updated.

 * ### Authorization
 * Requires a user access token that includes the `moderator:read:automod_settings` scope. The ID in the `moderator_user_id` condition parameter must match the user ID in the access token. If app access token used, then additionally requires the `moderator:read:automod_settings` scope for the moderator.

 * The moderator must be a moderator or broadcaster for the specified broadcaster.
 */
export interface MessageNotification {
	/** An object that identifies the message. */
	metadata: Metadata;
	/** An object that contains the message. */
	payload: Payload;
}
export function isMessageNotification(message: Main.EventSub.Message): message is MessageNotification {
	return Main.EventSub.isMessageNotification(message) && message.metadata.subscription_type === "automod.settings.update" && message.metadata.subscription_version === "1";
}

export type Metadata = Main.EventSub.MetadataWithSubscription<"notification", Payload["subscription"]>;

export type Payload = Main.EventSub.Payload<Main.EventSub.PayloadSubscription<RequestBody>, PayloadEvent>;
export type PayloadSubscription = Main.EventSub.PayloadSubscription<RequestBody>;
export interface PayloadEvent {
	/** The ID of the broadcaster specified in the request. */
	broadcaster_user_id: string;
	/** The login of the broadcaster specified in the request. */
	broadcaster_user_login: string;
	/** The user name of the broadcaster specified in the request. */
	broadcaster_user_name: string;
	/** The ID of the moderator who changed the channel settings. */
	moderator_user_id: string;
	/** The moderator’s login. */
	moderator_user_login: string;
	/** The moderator’s user name. */
	moderator_user_name: string;
	/** **Integer**. The Automod level for hostility involving name calling or insults. */
	bullying: number;
	/** **Integer**. The default AutoMod level for the broadcaster. This field is `null` if the broadcaster has set one or more of the individual settings. */
	overall_level: number | null;
	/** **Integer**. The Automod level for discrimination against disability. */
	disability: number;
	/** **Integer**. The Automod level for racial discrimination. */
	race_ethnicity_or_religion: number;
	/** **Integer**. The Automod level for discrimination against women. */
	misogyny: number;
	/** **Integer**. The AutoMod level for discrimination based on sexuality, sex, or gender. */
	sexuality_sex_or_gender: number;
	/** **Integer**. The Automod level for hostility involving aggression. */
	aggression: number;
	/** **Integer**. The Automod level for sexual content. */
	sex_based_terms: number;
	/** **Integer**. The Automod level for profanity. */
	swearing: number;
}