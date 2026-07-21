import Groq from "groq-sdk";

let client = null;

export const getGroqClient = () => {
	if (!process.env.GROQ_API_KEY) {
		throw new Error("GROQ_API_KEY is not set");
	}
	if (!client) {
		client = new Groq({ apiKey: process.env.GROQ_API_KEY });
	}
	return client;
};
