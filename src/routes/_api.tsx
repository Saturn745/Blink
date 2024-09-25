import { getDefaultServer, getServer } from "@/utils/storage/servers";
import { getUser } from "@/utils/storage/user";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_api")({
	beforeLoad: async ({ context, location }) => {
		// console.log(context.api);
		console.log(context.user);
		if (!context.api) {
			const currentServerId = await getDefaultServer();
			if (currentServerId) {
				const currentServer = await getServer(currentServerId);
				if (currentServer?.address) {
					const apiTemp = context.jellyfinSDK.createApi(
						currentServer?.address,
						undefined,
					);
					try {
						await getSystemApi(apiTemp).getPingSystem();
					} catch (error) {
						console.error(error);
						throw redirect({
							to: "/error/$code",
							params: {
								code: "101",
							},
						});
					}
					const userOnDisk = await getUser();
					if (userOnDisk) {
						if (location.pathname !== "/login/manual") {
							const apiTemp = context.jellyfinSDK.createApi(
								currentServer?.address,
								userOnDisk.AccessToken,
							);
							try {
								const user = await getUserApi(apiTemp).getCurrentUser();
								// return { user: user.data };
							} catch (error) {
								console.error(error);
								throw redirect({
									to: "/login/manual",
									search: {
										redirect: location.href,
									},
								});
							}
						}
						context.createApi(currentServer?.address, userOnDisk.AccessToken);
					} else {
						context.jellyfinSDK.createApi(currentServer?.address, undefined);
						context.createApi(currentServer?.address, undefined); // Creates Api

						// return { api: apiTemp };
					}
				}
			}
		} else if (context.api) {
			if (context.api.accessToken && location.pathname !== "/login/manual") {
				try {
					await getUserApi(context.api).getCurrentUser(); // Verify user is able to authenticate
		
				} catch (error) {
					console.error(error);
					throw redirect({
						to: "/login/manual",
						search: {
							redirect: location.href,
						},
					});
				}
			}
		}
	},
});