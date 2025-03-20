import { Hono } from "hono";
<<<<<<< HEAD
import type { OAuthHelpers } from "workers-mcp/vendor/workers-oauth-provider/oauth-provider.js";
=======
import { OAuthHelpers } from "@cloudflare/workers-oauth-provider";
>>>>>>> 69b224d (Use @cloudflare/workers-oauth-provider)

export type Bindings = Env & {
	OAUTH_PROVIDER: OAuthHelpers;
};

type Variables = {
	isLoggedIn: boolean;
};
const app = new Hono<{
	Bindings: Bindings;
	Variables: Variables;
}>();
export default app;
