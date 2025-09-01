import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
	convertToModelMessages,
	jsonSchema,
	type JSONSchema7,
	streamText,
	type UIMessage,
} from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { models } from "../models";

type Env = {
	AI: Ai;
};

type PostInferenceBody = {
	lora: string | null;
	messages: UIMessage[];
	model: keyof AiModels;
	max_tokens: number;
	stream: boolean;
	system_message: string;
	tools: Tool[];
};

async function replyToMessage(request: Request, env: Env, _ctx: ExecutionContext) {
	const modelNames = models.map((model) => model.name);

	const {
		model,
		messages,
		system_message,
		max_tokens,
		tools = [],
		lora: _lora,
	} = await request.json<PostInferenceBody>();

	// Invalid model sent to API, return 400
	if (!modelNames.includes(model)) {
		return new Response(null, {
			status: 400,
		});
	}

	const workersai = createWorkersAI({
		binding: env.AI,
	});

	const mcpTools = Object.fromEntries(
		tools.map((t) => {
			return [
				t.name,
				{
					description: t.description || t.name,
					inputSchema: jsonSchema(t.inputSchema as JSONSchema7),
				},
			];
		}),
	);

	const result = streamText({
		maxOutputTokens: max_tokens,
		messages: convertToModelMessages(messages),
		model: workersai(model as Parameters<typeof workersai>[0]),
		onError: (err) => {
			console.error("error in replyToMessage/streamText", err);
		},
		system: system_message,
		tools: mcpTools,
	});

	return result.toUIMessageStreamResponse({
		onError: (error: unknown) => {
			console.error("error in replyToMessage/toUIMessageStreamResponse", error);
			return "Error during inference";
		},
		headers: {
			"Content-Type": "text/x-unknown",
			"content-encoding": "identity",
			"transfer-encoding": "chunked",
		},
	});
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		switch (`${request.method} ${url.pathname}`) {
			case "POST /api/inference":
				return replyToMessage(request, env, ctx);
			default:
				return new Response("Not found", { status: 404 });
		}
	},
};
